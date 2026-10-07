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
       if(p.SessionId==System.Diagnostics.Process.GetCurrentProcess().SessionId && String.Equals(p.MainModule.FileName,Assembly.GetExecutingAssembly().Location,StringComparison.OrdinalIgnoreCase)) { Native.ShowWindowAsync(w,9); Native.SetForegroundWindow(w); return false; }
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
 readonly Label status=new Label(),hint=new Label(),details=new Label();
 readonly Button retry=new Button(),close=new Button(),choose=new Button();
 readonly System.Windows.Forms.Timer animation=new System.Windows.Forms.Timer();
 readonly IRiotPlatform platform;
 readonly ClientConfig clientConfig;
 readonly LauncherEngine engine;
 readonly CancellationTokenSource cancellation=new CancellationTokenSource();
 readonly string[] request;
 readonly Image logo;
 bool busy,loading=true; float angle;
 internal LauncherForm(string[] args,IRiotPlatform suppliedPlatform=null,ClientConfig suppliedConfig=null) {
  platform=suppliedPlatform ?? new WindowsRiotPlatform(); clientConfig=suppliedConfig ?? new ClientConfig(ClientConfig.DefaultPath,Native.Verify);
  request=args; engine=new LauncherEngine(platform);
  Text="ASCEND Launcher"; ClientSize=new Size(460,260); FormBorderStyle=FormBorderStyle.None;
  StartPosition=FormStartPosition.CenterScreen; MaximizeBox=false; MinimizeBox=false;
  BackColor=Color.FromArgb(15,15,16); ForeColor=Color.FromArgb(245,241,229);
  Font=new Font("Segoe UI",10); DoubleBuffered=true; AutoScaleMode=AutoScaleMode.Dpi;
  using(var stream=Assembly.GetExecutingAssembly().GetManifestResourceStream("ascend-logo.png")) logo=new Bitmap(stream);
  using(var stream=Assembly.GetExecutingAssembly().GetManifestResourceStream("ascend-window.ico"))
  using(var embedded=new Icon(stream)) Icon=(Icon)embedded.Clone();
  var brand=new Label {Text="ASCEND",TextAlign=ContentAlignment.MiddleCenter,ForeColor=Color.FromArgb(235,174,77),Font=new Font("Segoe UI",9,FontStyle.Bold)}; brand.SetBounds(130,96,200,18); Controls.Add(brand);
  status.SetBounds(25,116,410,52); status.TextAlign=ContentAlignment.MiddleCenter; status.Font=new Font("Segoe UI",13,FontStyle.Bold); status.Text="Đang chuẩn bị...";
  hint.SetBounds(22,216,416,22); hint.TextAlign=ContentAlignment.MiddleCenter; hint.ForeColor=Color.FromArgb(156,156,165); hint.Text="Vui lòng chờ trong giây lát.";
  retry.Text="Thử lại"; retry.SetBounds(127,208,96,34); retry.Click+=async delegate { await Attempt(); };
  close.Text="Đóng"; close.SetBounds(237,208,96,34); close.Click+=delegate { Close(); };
  choose.Text="Chọn Riot Client"; choose.SetBounds(35,278,285,34); choose.Click+=async delegate { await ChooseClient(); };
  details.SetBounds(25,170,410,65); details.TextAlign=ContentAlignment.MiddleCenter; details.Visible=false;
  foreach(var button in new[]{retry,close,choose}) { button.FlatStyle=FlatStyle.Flat; button.FlatAppearance.BorderColor=Color.FromArgb(81,66,43); button.BackColor=Color.FromArgb(31,31,35); button.ForeColor=Color.FromArgb(235,174,77); button.Visible=false; button.Cursor=Cursors.Hand; }
  var dismiss=new Button {Text="×",FlatStyle=FlatStyle.Flat,ForeColor=Color.FromArgb(156,156,165),BackColor=BackColor,TabStop=false}; dismiss.SetBounds(421,8,28,26); dismiss.FlatAppearance.BorderSize=0; dismiss.Click+=delegate { Close(); };
  Controls.AddRange(new Control[]{status,hint,details,retry,close,choose,dismiss});
  animation.Interval=35; animation.Tick+=delegate { angle=(angle+9)%360; Invalidate(new Rectangle(203,169,54,40)); }; animation.Start();
  Shown+=async delegate { await Attempt(); };
  FormClosed+=delegate { cancellation.Cancel(); animation.Dispose(); logo.Dispose(); Icon.Dispose(); platform.Log("LAUNCHER_CLOSED"); };
 }
 protected override void OnPaint(PaintEventArgs e) {
  base.OnPaint(e); e.Graphics.SmoothingMode=SmoothingMode.AntiAlias;
  using(var border=new Pen(Color.FromArgb(31,31,35))) e.Graphics.DrawRectangle(border,0,0,ClientSize.Width-1,ClientSize.Height-1);
  float scale=Math.Min(72f/logo.Width,72f/logo.Height);
  float width=logo.Width*scale, height=logo.Height*scale;
  e.Graphics.InterpolationMode=InterpolationMode.HighQualityBicubic;
  e.Graphics.DrawImage(logo,new RectangleF(230-width/2,61-height/2,width,height));
  if(loading) {
   using(var track=new Pen(Color.FromArgb(42,37,30),3)) e.Graphics.DrawEllipse(track,216,174,28,28);
   using(var accent=new Pen(Color.FromArgb(235,164,57),3)) { accent.StartCap=LineCap.Round; accent.EndCap=LineCap.Round; e.Graphics.DrawArc(accent,216,174,28,28,angle,105); }
  }
 }
 void State(LaunchState state,string text) {
  if(IsDisposed) return;
  if(InvokeRequired) { BeginInvoke(new Action(delegate { State(state,text); })); return; }
  status.Font=new Font("Segoe UI",state==LaunchState.ERROR ? 11 : 13,FontStyle.Bold);
  status.Text=state==LaunchState.SUCCESS ? "✓ "+text : text; platform.Log("state="+state);
 }
 async Task Attempt() {
  if(busy) return; busy=true; loading=true; ClientSize=new Size(460,260); details.Visible=false; choose.Visible=false; retry.Visible=false; close.SetBounds(237,208,96,34); close.Visible=false; hint.SetBounds(22,216,416,22); hint.Text="Vui lòng chờ trong giây lát."; hint.Visible=true; Invalidate();
  try {
   State(LaunchState.STARTING,"Đang chuẩn bị...");
   if(!LauncherEngine.ValidRequest(request)) throw new LauncherError("Yêu cầu mở client không hợp lệ.");
   await Task.Run(async delegate { await engine.Run(request[0],State,cancellation.Token); });
   loading=false; Invalidate();
   await Task.Delay(750,cancellation.Token); Close();
  } catch(OperationCanceledException) {} catch(Exception error) {
   if(!IsDisposed) {
    loading=false; hint.Visible=false; retry.Visible=LauncherEngine.ValidRequest(request); close.Visible=true;
    State(LaunchState.ERROR,error is LauncherError ? error.Message : "Không thể mở Riot Client. Vui lòng thử lại.");
    if(LauncherEngine.ValidRequest(request)) ShowSelection(error is RiotNotFound);
    platform.Log("ERROR category="+error.GetType().Name); Invalidate();
   }
  } finally { busy=false; }
 }
 void ShowSelection(bool missing) {
  ClientSize=new Size(460,330); choose.Visible=true; close.Visible=true; close.SetBounds(330,278,96,34);
  retry.Visible=!missing; choose.Text=missing ? "Chọn Riot Client" : "Chọn lại đường dẫn Riot Client";
  details.Visible=missing; details.Text="ASCEND không thể tự động xác định vị trí Riot Client trên máy của bạn.";
  hint.SetBounds(22,241,416,25); hint.Text="Vui lòng chọn file RiotClientServices.exe"; hint.Visible=true;
  Invalidate();
 }
 async Task ChooseClient() {
  if(busy || !LauncherEngine.ValidRequest(request)) return;
  using(var picker=new OpenFileDialog {Title="Chọn Riot Client",Filter="Riot Client (RiotClientServices.exe)|RiotClientServices.exe|Executable (*.exe)|*.exe|All files (*.*)|*.*",CheckFileExists=true,CheckPathExists=true,Multiselect=false,RestoreDirectory=true,DereferenceLinks=false}) {
   if(picker.ShowDialog(this)!=DialogResult.OK) return;
   busy=true; choose.Enabled=false;
   try {
    await Task.Run(delegate { cancellation.Token.ThrowIfCancellationRequested(); clientConfig.Save(picker.FileName); });
    if(IsDisposed) return;
    State(LaunchState.FINDING_RIOT,"Đã tìm thấy Riot Client");
    await Task.Delay(500,cancellation.Token);
   } catch(OperationCanceledException) { return; }
   catch(Exception error) {
    if(!IsDisposed) { State(LaunchState.ERROR,error is LauncherError ? error.Message : "Không thể lưu đường dẫn Riot Client. Vui lòng thử lại."); ShowSelection(false); }
    return;
   } finally { busy=false; if(!IsDisposed) choose.Enabled=true; }
  }
  if(!IsDisposed) await Attempt();
 }
}
}
