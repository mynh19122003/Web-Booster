// Compiled only by review-picker.ps1. Never included in the installed launcher.
using System;
using System.Collections.Generic;
using System.IO;
using System.Windows.Forms;
namespace AscendLauncher {
internal sealed class PickerReviewPlatform:IRiotPlatform {
 readonly WindowsRiotPlatform native=new WindowsRiotPlatform();
 internal readonly ClientConfig Config=new ClientConfig(Path.Combine(AppDomain.CurrentDomain.BaseDirectory,"picker-review-config.json"),Native.Verify);
 public string FindClient(){return Config.Find(new string[0],delegate{return null;});}
 public void Verify(string path){native.Verify(path);}
 public bool Exists(string path){return native.Exists(path);}
 public IntPtr FindWindow(IList<string> paths,bool minimized){return native.FindWindow(paths,minimized);}
 public void Focus(IntPtr window){native.Focus(window);}
 public int Spawn(string path,bool league){return native.Spawn(path,league);}
 public void Log(string message){native.Log("pickerReview "+message);}
}
internal static class PickerReview {
 [STAThread] static void Main(){
  Application.EnableVisualStyles(); Application.SetCompatibleTextRenderingDefault(false);
  var platform=new PickerReviewPlatform();
  Application.Run(new LauncherForm(new[]{"ascendriot://open/league"},platform,platform.Config));
 }
}
}
