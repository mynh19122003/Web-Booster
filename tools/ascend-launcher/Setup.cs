using System;
using System.IO;
using System.Drawing;
using System.Reflection;
using System.Diagnostics;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace AscendLauncher {
internal static class SetupProgram {
 [STAThread] static void Main(string[] args) {
  Application.EnableVisualStyles();Application.SetCompatibleTextRenderingDefault(false);
  bool remove=args.Length==1&&args[0]=="--uninstall";
  if(args.Length>0&&!remove&&!(args.Length==1&&args[0]=="--repair")) {MessageBox.Show("Yêu cầu bộ cài không hợp lệ.","ASCEND");return;}
  // An installed uninstaller cannot remove its own loaded EXE. Run a copy outside the installation directory.
  string self=Assembly.GetExecutingAssembly().Location;
  if(remove&&String.Equals(self,Path.Combine(LauncherInstallation.DefaultRoot,"AscendLauncherSetup.exe"),StringComparison.OrdinalIgnoreCase)) {
   string temp=Path.Combine(Path.GetTempPath(),"AscendLauncherUninstall-"+Guid.NewGuid().ToString("N")+".exe");
   try {File.Copy(self,temp);Process.Start(new ProcessStartInfo(temp,"--uninstall"){UseShellExecute=false});}
   catch(Exception){MessageBox.Show("Không thể mở bộ gỡ cài đặt. Hãy đóng launcher và thử lại.","ASCEND");}
   return;
  }
  Application.Run(new SetupForm(remove));
 }
}
internal sealed class SetupForm:Form {
 readonly LauncherInstallation installation=new LauncherInstallation();
 readonly Label status=new Label();readonly TextBox diagnostics=new TextBox();
 readonly Button install=new Button(),repair=new Button(),remove=new Button(),test=new Button();
 internal SetupForm(bool removing) {
  Text="ASCEND Launcher "+Release.Version+" — Setup";ClientSize=new Size(620,470);StartPosition=FormStartPosition.CenterScreen;FormBorderStyle=FormBorderStyle.FixedDialog;MaximizeBox=false;
  BackColor=Color.FromArgb(15,15,16);ForeColor=Color.FromArgb(245,241,229);Font=new Font("Segoe UI",10);
  using(var stream=Assembly.GetExecutingAssembly().GetManifestResourceStream("ascend-window.ico"))using(var icon=new Icon(stream))Icon=(Icon)icon.Clone();
  var title=new Label{Text=removing?"Gỡ ASCEND Launcher":"Cài ASCEND Launcher "+Release.Version,Font=new Font("Segoe UI",18,FontStyle.Bold),ForeColor=Color.FromArgb(235,174,77)};title.SetBounds(24,20,570,42);
  var note=new Label{Text="Windows x64 • Cài cho user hiện tại • Không cần quyền Administrator\nBản phát triển chưa ký số. Không tự thay đổi thiết lập bảo mật.",AutoSize=false};note.SetBounds(24,72,570,52);
  status.SetBounds(24,130,570,52);status.Text="Chọn Cài đặt, rồi Mở launcher → CÀI GIAO THỨC để kết nối trình duyệt.";
  install.Text="Cài đặt / Cập nhật";repair.Text="Repair protocol";remove.Text="Gỡ cài đặt";test.Text="Mở launcher";
  var buttons=new[]{install,repair,test,remove};for(int i=0;i<buttons.Length;i++){var b=buttons[i];b.SetBounds(24+i*145,190,137,38);b.FlatStyle=FlatStyle.Flat;b.ForeColor=Color.FromArgb(235,174,77);Controls.Add(b);}
  diagnostics.SetBounds(24,243,570,200);diagnostics.Multiline=true;diagnostics.ReadOnly=true;diagnostics.ScrollBars=ScrollBars.Vertical;diagnostics.BackColor=Color.FromArgb(25,25,28);diagnostics.ForeColor=ForeColor;
  Controls.AddRange(new Control[]{title,note,status,diagnostics});
  install.Visible=!removing;repair.Visible=!removing;test.Visible=!removing;
  install.Click+=async delegate {await Execute(delegate {
   byte[] payload;using(var stream=Assembly.GetExecutingAssembly().GetManifestResourceStream("launcher.exe"))using(var memory=new MemoryStream()){stream.CopyTo(memory);payload=memory.ToArray();}
   installation.Install(payload,File.ReadAllBytes(Assembly.GetExecutingAssembly().Location));
  },"Đã cài ASCEND Launcher. Chọn Mở launcher → CÀI GIAO THỨC để kết nối trình duyệt.");};
  repair.Click+=async delegate {await Execute(installation.Repair,"Đã đăng ký lại ascendriot:// cho Windows user hiện tại.");};
  remove.Click+=async delegate {
   if(String.Equals(Assembly.GetExecutingAssembly().Location,installation.Setup,StringComparison.OrdinalIgnoreCase)){Process.Start(new ProcessStartInfo(installation.Setup,"--uninstall"){UseShellExecute=false});Close();return;}
   if(MessageBox.Show("Gỡ ASCEND Launcher cho user hiện tại? Đường dẫn Riot đã lưu sẽ được giữ lại.","ASCEND",MessageBoxButtons.YesNo,MessageBoxIcon.Question)!=DialogResult.Yes)return;
   await Execute(installation.Uninstall,"Đã gỡ launcher và protocol thuộc bản cài này.");
  };
  test.Click+=delegate {try{Process.Start(new ProcessStartInfo(installation.Exe){UseShellExecute=false});status.Text="Launcher đã mở. Chọn CÀI GIAO THỨC nếu chưa kết nối trình duyệt.";}catch(Exception){status.Text="Không mở được launcher. Hãy cài đặt và xem thông tin bên dưới.";}};
  RefreshDiagnostics();FormClosed+=delegate{Icon.Dispose();};
 }
 void RefreshDiagnostics(){diagnostics.Text=installation.Diagnostics();}
 async Task Execute(Action action,string success) {
  foreach(var button in new[]{install,repair,remove,test})button.Enabled=false;
  try{status.Text="Đang xử lý...";await Task.Run(action);status.Text=success;}
  catch(Exception error){status.Text="Không thể hoàn thành: "+error.Message;}
  finally{if(!IsDisposed){foreach(var button in new[]{install,repair,remove,test})button.Enabled=true;RefreshDiagnostics();}}
 }
}
}
