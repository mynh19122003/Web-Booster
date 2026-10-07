using System;
using System.IO;
using System.Drawing;
using System.Linq;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Win32;
namespace AscendLauncher {
internal static class UiReview {
 [STAThread]static void Main(string[] args){Application.EnableVisualStyles();Application.SetCompatibleTextRenderingDefault(false);using(var host=new Form{Opacity=0,ShowInTaskbar=false}){host.Shown+=async delegate{try{await Run(args[0],args[1]);}catch(Exception e){Console.Error.WriteLine(e);Environment.ExitCode=1;}finally{host.Close();}};Application.Run(host);}}
 static void Capture(Form form,string path){using(var bitmap=new Bitmap(form.Width,form.Height)){form.DrawToBitmap(bitmap,form.ClientRectangle);bitmap.Save(path,System.Drawing.Imaging.ImageFormat.Png);}}
 static async Task Run(string exe,string output){string key=@"Software\ASCEND\UiReview\"+Guid.NewGuid().ToString("N");var protocol=new ProtocolRegistration(Path.GetFullPath(exe),Registry.CurrentUser,key);double now=0;try{
 using(var form=new LauncherForm(new string[0],new FlowPlatform(),null,protocol,new AutoLaunchCountdown(delegate{return now;}))){form.ShowInTaskbar=false;form.Opacity=0;form.Show();await Task.Delay(50);Capture(form,Path.Combine(output,"ui-home.png"));protocol.Install();await form.BeginCountdown();now=13;await form.TickCountdown();foreach(string text in new[]{"Đang chuẩn bị Riot Client","Riot Client sẽ được mở sau","MỞ NGAY","HỦY","Gỡ giao thức","giây"})if(!form.Controls.Cast<Control>().Any(c=>c.Text==text&&c.Visible))throw new Exception("Missing Vietnamese label: "+text);Capture(form,Path.Combine(output,"ui-countdown.png"));form.Scale(new SizeF(1.5f,1.5f));foreach(Control c in form.Controls)c.Font=new Font(c.Font.FontFamily,c.Font.Size*1.5f,c.Font.Style,c.Font.Unit);Capture(form,Path.Combine(output,"ui-countdown-150.png"));form.Close();}
 using(var form=new LauncherForm(new string[0],new FlowPlatform{Missing=true},null,protocol)){form.ShowInTaskbar=false;form.Opacity=0;form.Show();await Task.Delay(50);await form.BeginCountdown();Capture(form,Path.Combine(output,"ui-missing.png"));form.Close();}
 Console.WriteLine("PASS: actual WinForms Vietnamese labels and Home/countdown/missing UI screenshots; 100% and scaled 150%; no real Riot launched.");
 }finally{Registry.CurrentUser.DeleteSubKeyTree(key,false);}}
}
}
