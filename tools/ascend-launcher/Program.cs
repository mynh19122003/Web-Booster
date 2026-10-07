using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Security.Principal;

namespace AscendLauncher {
internal static class Program {
 [STAThread] static void Main(string[] args) {
  bool owned;
  using(var mutex=new Mutex(true,@"Local\ASCEND.RiotLauncher."+WindowsIdentity.GetCurrent().User.Value,out owned)) {
   if(!owned) {
    Native.EnumWindows(delegate(IntPtr w,IntPtr unused) {
     var title=new System.Text.StringBuilder(80); Native.GetWindowText(w,title,80);
     if(title.ToString()=="ASCEND Launcher") {
      uint pid; Native.GetWindowThreadProcessId(w,out pid);
      try { using(var p=System.Diagnostics.Process.GetProcessById((int)pid)) {
       if(p.SessionId==System.Diagnostics.Process.GetCurrentProcess().SessionId && String.Equals(p.MainModule.FileName,Assembly.GetExecutingAssembly().Location,StringComparison.OrdinalIgnoreCase)) { if(LauncherEngine.ValidRequest(args))Native.ForwardRequest(w,args[0]); Native.ShowWindowAsync(w,9); Native.SetForegroundWindow(w); return false; }
      }} catch(System.ComponentModel.Win32Exception){} catch(InvalidOperationException){}
     } return true;
    },IntPtr.Zero); return;
   }
   try { Application.EnableVisualStyles(); Application.SetCompatibleTextRenderingDefault(false); Application.Run(new LauncherForm(args)); }
   finally { mutex.ReleaseMutex(); }
  }
 }
}
internal sealed class LauncherForm:Form {
 readonly IRiotPlatform platform;readonly ClientConfig config;readonly ProtocolRegistration protocol;readonly LauncherEngine engine;
 readonly Label status=new Label(),details=new Label(),count=new Label(),hint=new Label(),units=new Label();
 readonly Button primary=new LauncherButton{Emphasized=true},secondary=new LauncherButton(),remove=new LauncherButton(),choose=new LauncherButton(),immediate=new LauncherButton();
 readonly Panel progress=new Panel();readonly Image logo;
 readonly System.Windows.Forms.Timer timer=new System.Windows.Forms.Timer();readonly AutoLaunchCountdown countdown;
 readonly CancellationTokenSource lifetime=new CancellationTokenSource();readonly string[] request;
 System.Collections.Generic.IList<string> windows;string action="ascendriot://open/league";bool busy,polling,afterDelay;LauncherState state;
 internal LauncherForm(string[] args,IRiotPlatform suppliedPlatform=null,ClientConfig suppliedConfig=null,ProtocolRegistration suppliedProtocol=null,AutoLaunchCountdown suppliedCountdown=null) {
  countdown=suppliedCountdown??new AutoLaunchCountdown();
  request=args;platform=suppliedPlatform??new WindowsRiotPlatform();config=suppliedConfig??new ClientConfig(ClientConfig.DefaultPath,Native.Verify);protocol=suppliedProtocol??new ProtocolRegistration();engine=new LauncherEngine(platform);
  Text="ASCEND Launcher";ClientSize=new Size(440,520);FormBorderStyle=FormBorderStyle.None;StartPosition=FormStartPosition.CenterScreen;MaximizeBox=false;MinimizeBox=false;
  BackColor=LauncherTheme.Surface;ForeColor=LauncherTheme.Text;Font=LauncherTheme.Font(16);DoubleBuffered=true;AutoScaleMode=AutoScaleMode.Dpi;
  using(var stream=Assembly.GetExecutingAssembly().GetManifestResourceStream("ascend-logo.png"))logo=new Bitmap(stream);
  using(var stream=Assembly.GetExecutingAssembly().GetManifestResourceStream("ascend-window.ico"))using(var icon=new Icon(stream))Icon=(Icon)icon.Clone();
  var brand=new Label{Text="ASCEND",TextAlign=ContentAlignment.MiddleCenter,ForeColor=LauncherTheme.Gold,Font=LauncherTheme.Font(13,FontStyle.Bold)};brand.SetBounds(120,101,200,24);
  status.SetBounds(28,137,384,76);status.TextAlign=ContentAlignment.MiddleCenter;status.Font=LauncherTheme.Font(28,FontStyle.Bold);
  details.SetBounds(28,220,384,106);details.TextAlign=ContentAlignment.MiddleCenter;details.ForeColor=LauncherTheme.Muted;
  count.SetBounds(100,250,240,80);count.TextAlign=ContentAlignment.MiddleCenter;count.Font=LauncherTheme.Font(68,FontStyle.Bold);count.ForeColor=LauncherTheme.Gold;
  units.Text="giây";units.TextAlign=ContentAlignment.MiddleCenter;units.ForeColor=LauncherTheme.Muted;units.SetBounds(170,330,100,24);
  progress.SetBounds(28,374,384,8);progress.Paint+=delegate(object sender,PaintEventArgs e){e.Graphics.SmoothingMode=SmoothingMode.AntiAlias;using(var track=LauncherTheme.Rounded(new RectangleF(0,0,progress.Width,progress.Height),4))using(var background=new SolidBrush(LauncherTheme.Border)){e.Graphics.FillPath(background,track);var saved=e.Graphics.Save();e.Graphics.SetClip(track);using(var accent=new SolidBrush(LauncherTheme.Gold))e.Graphics.FillRectangle(accent,0,0,progress.Width*(AutoLaunchCountdown.RIOT_AUTO_LAUNCH_DELAY_SECONDS-countdown.Remaining)/AutoLaunchCountdown.RIOT_AUTO_LAUNCH_DELAY_SECONDS,progress.Height);e.Graphics.Restore(saved);}};
  hint.SetBounds(28,500,384,18);hint.TextAlign=ContentAlignment.MiddleCenter;hint.Font=LauncherTheme.Font(12);hint.ForeColor=LauncherTheme.Muted;hint.Text="ASCEND Launcher "+Release.Version;
  primary.SetBounds(28,350,384,48);secondary.SetBounds(28,460,384,40);remove.SetBounds(28,460,384,40);choose.SetBounds(28,408,384,44);immediate.SetBounds(28,408,384,44);
  remove.ForeColor=LauncherTheme.Muted;remove.Font=LauncherTheme.Font(15);
  foreach(var b in new[]{primary,secondary,remove,choose,immediate})Controls.Add(b);
  var dismiss=new LauncherButton{Text="×",ForeColor=LauncherTheme.Muted,TabStop=true,AccessibleName="Đóng launcher"};dismiss.SetBounds(388,16,36,36);dismiss.Click+=delegate{Close();};
  Controls.AddRange(new Control[]{brand,status,details,count,units,progress,hint,dismiss});
  primary.Click+=async delegate {
   if(busy)return;
   if(state==LauncherState.HOME){if(protocol.Read()!=ProtocolState.INSTALLED)await InstallProtocol();else await BeginCountdown();}
   else if(state==LauncherState.COUNTDOWN){StopCountdown();await Launch();}
   else if(state==LauncherState.RIOT_NOT_FOUND||state==LauncherState.ERROR){if(afterDelay)await Launch();else await BeginCountdown();}
  };
  secondary.Click+=delegate{if(state==LauncherState.COUNTDOWN)Home();else Close();};
  immediate.Click+=async delegate{if(!busy){StopCountdown();await Launch();}};
  remove.Click+=delegate{RemoveProtocols();};choose.Click+=async delegate{await ChooseClient();};
  timer.Interval=250;timer.Tick+=async delegate{await TickCountdown();};
  Shown+=async delegate{if(request.Length==0)Home();else if(LauncherEngine.ValidRequest(request))await HandleRequest(request[0]);else Error(new LauncherError("Yêu cầu mở client không hợp lệ."));};
  FormClosed+=delegate{StopCountdown();lifetime.Cancel();timer.Dispose();logo.Dispose();Icon.Dispose();platform.Log("LAUNCHER_CLOSED");};
 }
 protected override void OnPaint(PaintEventArgs e){base.OnPaint(e);e.Graphics.SmoothingMode=SmoothingMode.AntiAlias;using(var pen=new Pen(LauncherTheme.Border))e.Graphics.DrawRectangle(pen,0,0,ClientSize.Width-1,ClientSize.Height-1);using(var glow=new GraphicsPath()){float dpi=ClientSize.Width/440f;glow.AddEllipse(170*dpi,17*dpi,100*dpi,94*dpi);using(var brush=new PathGradientBrush(glow)){brush.CenterColor=Color.FromArgb(32,LauncherTheme.Gold);brush.SurroundColors=new[]{Color.FromArgb(0,LauncherTheme.Gold)};e.Graphics.FillPath(brush,glow);}}float scale=Math.Min(64f/logo.Width,64f/logo.Height)*ClientSize.Width/440f;e.Graphics.DrawImage(logo,new RectangleF(ClientSize.Width/2f-logo.Width*scale/2,62*ClientSize.Width/440f-logo.Height*scale/2,logo.Width*scale,logo.Height*scale));}
 protected override void WndProc(ref Message message){
  if(message.Msg==0x004A&&message.LParam!=IntPtr.Zero){var data=(Native.CopyData)System.Runtime.InteropServices.Marshal.PtrToStructure(message.LParam,typeof(Native.CopyData));if(data.marker==new IntPtr(0x415343)&&data.data!=IntPtr.Zero&&data.bytes>=2&&data.bytes<=256&&data.bytes%2==0){string uri=System.Runtime.InteropServices.Marshal.PtrToStringUni(data.data,data.bytes/2-1);if(LauncherEngine.ValidRequest(new[]{uri}))BeginInvoke(new Action(async delegate{await HandleRequest(uri);}));}message.Result=new IntPtr(1);return;}base.WndProc(ref message);
 }
 void View(LauncherState value,string title,string text){state=value;status.Text=title;details.Text=text;count.Visible=false;units.Visible=false;progress.Visible=false;foreach(var b in new[]{primary,secondary,remove,choose,immediate}){b.Visible=false;b.Enabled=true;}details.SetBounds(28,220,384,106);primary.SetBounds(28,350,384,48);secondary.SetBounds(28,460,384,40);remove.SetBounds(28,460,384,40);hint.Text="ASCEND Launcher "+Release.Version;platform.Log("launcherState="+value);}
 void StopCountdown(){timer.Stop();countdown.Stop();}
 internal LauncherState CurrentState {get{return state;}}
 internal void Home(){StopCountdown();afterDelay=false;var current=protocol.Read();View(LauncherState.HOME,current==ProtocolState.INSTALLED?"✓ Giao thức ASCEND đã được cài":current==ProtocolState.BROKEN?"Liên kết trình duyệt cần được sửa.":"Kết nối ASCEND với trình duyệt",current==ProtocolState.INSTALLED?"Giao thức: ascendriot://":protocol.Conflict??"Bạn cần cài giao thức ASCEND một lần để website có thể mở Launcher.");primary.Visible=true;primary.Text=current==ProtocolState.INSTALLED?"MỞ RIOT CLIENT":current==ProtocolState.BROKEN?"SỬA GIAO THỨC":"CÀI GIAO THỨC";primary.Enabled=protocol.Conflict==null;
  if(current==ProtocolState.INSTALLED){immediate.Visible=true;immediate.Text="MỞ RIOT CLIENT NGAY";remove.Visible=true;remove.Text="Gỡ toàn bộ giao thức";}
  else {secondary.Visible=true;secondary.Text="Đóng";if(current==ProtocolState.BROKEN){remove.Visible=true;remove.SetBounds(28,408,384,44);remove.Text="Gỡ giao thức";}}
 }
 async Task InstallProtocol(){busy=true;View(LauncherState.INSTALLING_PROTOCOL,"Đang cài giao thức...","");try{await Task.Run(delegate{protocol.Install();});if(!IsDisposed){Home();status.Text="✓ Giao thức đã được cài thành công.";}}catch(Exception error){if(!IsDisposed)Error(error);}finally{busy=false;}}
 bool Registered(){if(protocol.Read()==ProtocolState.INSTALLED)return true;Home();return false;}
 internal async Task HandleRequest(string uri){if(busy||countdown.Active||!LauncherEngine.ValidRequest(new[]{uri}))return;action=uri;if(!Registered())return;
  if(LauncherEngine.IsTest(uri)){View(LauncherState.SUCCESS,"✓ ASCEND Launcher hoạt động.","Kiểm tra protocol thành công.");try{await Task.Delay(2000,lifetime.Token);Close();}catch(OperationCanceledException){}return;}
  await BeginCountdown();
 }
 internal async Task BeginCountdown(){if(busy||!Registered())return;StopCountdown();afterDelay=false;busy=true;View(LauncherState.FINDING_RIOT,"Đang tìm Riot Client...","");
  try{windows=await Task.Run(delegate{return engine.PrepareCountdown();});if(IsDisposed||lifetime.IsCancellationRequested)return;busy=false;
   if(engine.HasRunningWindow(windows)){await Launch(true);return;}
   View(LauncherState.COUNTDOWN,"Đang chuẩn bị Riot Client","Riot Client sẽ được mở sau");details.SetBounds(28,210,384,38);primary.SetBounds(28,400,186,48);primary.Visible=true;primary.Text="MỞ NGAY";secondary.SetBounds(226,400,186,48);secondary.Visible=true;secondary.Text="HỦY";remove.Visible=true;remove.SetBounds(28,460,384,40);remove.Text="Gỡ giao thức";count.Visible=true;units.Visible=true;progress.Visible=true;countdown.Start();RenderCountdown();timer.Start();
  }catch(Exception error){if(!IsDisposed)Error(error);}finally{busy=false;}
 }
 void RenderCountdown(){count.Text=countdown.Remaining.ToString();hint.Text="ASCEND Launcher "+Release.Version;progress.Invalidate();}
 internal async Task TickCountdown(){if(polling||busy||!countdown.Active)return;polling=true;try{if(!Registered()){StopCountdown();return;}if(engine.HasRunningWindow(windows)){StopCountdown();await Launch(true);return;}bool due=countdown.Tick();RenderCountdown();if(due){StopCountdown();await Launch();}}catch(Exception error){StopCountdown();if(!IsDisposed)Error(error);}finally{polling=false;}}
 internal async Task Launch(bool existing=false){if(busy||!Registered())return;StopCountdown();afterDelay=true;busy=true;View(LauncherState.LAUNCHING_RIOT,"Đang mở Riot Client...","");
  try{await Task.Run(async delegate{await engine.Run(action,EngineState,lifetime.Token);});if(IsDisposed)return;if(existing)status.Text="✓ Riot Client đang chạy";await Task.Delay(existing?500:750,lifetime.Token);Close();}
  catch(OperationCanceledException){}catch(Exception error){if(!IsDisposed)Error(error);}finally{busy=false;}
 }
 void EngineState(LaunchState value,string text){if(IsDisposed)return;if(InvokeRequired){BeginInvoke(new Action(delegate{EngineState(value,text);}));return;}state=value==LaunchState.SUCCESS?LauncherState.SUCCESS:value==LaunchState.WAITING_FOR_WINDOW?LauncherState.WAITING_FOR_RIOT:value==LaunchState.FINDING_RIOT?LauncherState.FINDING_RIOT:LauncherState.LAUNCHING_RIOT;status.Text=value==LaunchState.SUCCESS?"✓ "+text:text;platform.Log("state="+value);}
 void Error(Exception error){StopCountdown();bool missing=error is RiotNotFound;View(missing?LauncherState.RIOT_NOT_FOUND:LauncherState.ERROR,missing?"Không tìm thấy Riot Client.":error is LauncherError?error.Message:"Không thể xử lý yêu cầu. Vui lòng thử lại.",missing?"ASCEND không thể tự động xác định vị trí Riot Client trên máy của bạn. Vui lòng chọn file RiotClientServices.exe.":"");
  primary.Visible=true;primary.Text="THỬ LẠI";choose.Visible=true;choose.Text=missing?"CHỌN RIOT CLIENT":"Chọn lại đường dẫn Riot Client";remove.Visible=true;remove.Text="Gỡ giao thức";platform.Log("ERROR category="+error.GetType().Name);
 }
 async Task ChooseClient(){if(busy)return;using(var picker=new OpenFileDialog{Title="Chọn Riot Client",Filter="Riot Client|RiotClientServices.exe|Executable (*.exe)|*.exe|All files (*.*)|*.*",CheckFileExists=true,CheckPathExists=true,Multiselect=false,RestoreDirectory=true,DereferenceLinks=false}){
  if(picker.ShowDialog(this)!=DialogResult.OK)return;busy=true;choose.Enabled=false;try{await Task.Run(delegate{config.Save(picker.FileName);});if(IsDisposed)return;status.Text="Đã tìm thấy Riot Client";await Task.Delay(500,lifetime.Token);}catch(OperationCanceledException){return;}catch(Exception error){if(!IsDisposed)Error(error);return;}finally{busy=false;if(!IsDisposed)choose.Enabled=true;}}
  if(afterDelay)await Launch();else await BeginCountdown();
 }
 void RemoveProtocols(){if(busy)return;StopCountdown();using(var dialog=new Form{Text="Gỡ các giao thức ASCEND?",ClientSize=new Size(430,205),StartPosition=FormStartPosition.CenterParent,FormBorderStyle=FormBorderStyle.FixedDialog,MaximizeBox=false,MinimizeBox=false,BackColor=BackColor,ForeColor=ForeColor,Font=Font}){
  var text=new Label{Text="Gỡ các giao thức ASCEND?\n\nSau khi gỡ, website sẽ không thể mở ASCEND Launcher cho tới khi bạn cài lại."};text.SetBounds(22,20,386,110);
  var cancel=new LauncherButton{Text="Hủy",DialogResult=DialogResult.Cancel};cancel.SetBounds(75,145,110,36);var confirm=new LauncherButton{Emphasized=true,Text="Gỡ giao thức",DialogResult=DialogResult.OK};confirm.SetBounds(203,145,150,36);dialog.Controls.AddRange(new Control[]{text,cancel,confirm});dialog.CancelButton=cancel;
  if(dialog.ShowDialog(this)!=DialogResult.OK){Home();return;}
 }
  try{string conflict=protocol.RemoveAll();Home();if(conflict!=null)details.Text=conflict;else status.Text="○ Giao thức chưa được cài";}catch(Exception error){Error(error);}
 }
}
}
