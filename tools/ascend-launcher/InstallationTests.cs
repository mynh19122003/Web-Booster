using System;
using System.IO;
using System.Diagnostics;
using Microsoft.Win32;
namespace AscendLauncher {
internal static class InstallationTests {
 static void Check(bool value,string message){if(!value)throw new Exception(message);}
 static int Main(string[] args) {
  string id=Guid.NewGuid().ToString("N"),keyPath=@"Software\ASCEND\LauncherInstallTests\"+id;
  string temp=Path.GetFullPath(Path.Combine(Path.GetTempPath(),"ASCEND installation test "+id));
  string root=Path.Combine(temp,"Launcher"),scheme=keyPath+@"\protocol",uninstall=keyPath+@"\uninstall";
  try {
   var installation=new LauncherInstallation(root,Registry.CurrentUser,scheme,uninstall);
   byte[] launcher=File.ReadAllBytes(args[0]),setup=File.ReadAllBytes(args[1]);
   installation.Install(launcher,setup);
   using(var key=Registry.CurrentUser.OpenSubKey(scheme))Check(key==null,"fresh setup silently registered protocol");
   installation.Repair(); // Explicit user repair/install action.
   Check(File.Exists(installation.Exe)&&File.Exists(installation.Setup),"standalone files not installed");
   using(var command=Registry.CurrentUser.OpenSubKey(scheme+@"\shell\open\command"))Check((string)command.GetValue("")==installation.Command,"absolute quoted command");
   using(var key=Registry.CurrentUser.OpenSubKey(scheme))Check((string)key.GetValue("URL Protocol")=="","URL Protocol missing");
   Registry.CurrentUser.DeleteSubKeyTree(scheme);installation.Repair();
   using(var command=Registry.CurrentUser.OpenSubKey(scheme+@"\shell\open\command"))Check((string)command.GetValue("")==installation.Command,"repair missing registry");
   installation.Install(launcher,setup); // Atomic release update, stable path.
   using(var process=Process.Start(new ProcessStartInfo(installation.Exe){UseShellExecute=false,WorkingDirectory=temp})) {
    bool visible=false;var watch=Stopwatch.StartNew();
    while(!process.HasExited&&watch.ElapsedMilliseconds<1000) {
     Native.EnumWindows(delegate(IntPtr w,IntPtr unused){uint pid;Native.GetWindowThreadProcessId(w,out pid);if(pid==process.Id&&Native.IsWindowVisible(w))visible=true;return true;},IntPtr.Zero);
     System.Threading.Thread.Sleep(50);
    }
    Check(visible,"standalone Home not visible");Check(!process.HasExited,"manual Home auto-closed");process.CloseMainWindow();Check(process.WaitForExit(5000)&&process.ExitCode==0,"manual Home did not close");
   }
   using(var key=Registry.CurrentUser.OpenSubKey(scheme,true))key.SetValue("Owner","OtherApplication");
   try{installation.Repair();throw new Exception("foreign handler overwritten");}catch(IOException){}
   installation.Uninstall();
   using(var key=Registry.CurrentUser.OpenSubKey(scheme))Check(key!=null&&(string)key.GetValue("Owner")=="OtherApplication","foreign handler removed");
   Registry.CurrentUser.DeleteSubKeyTree(scheme);installation.Install(launcher,setup);
   installation.Uninstall();
   using(var key=Registry.CurrentUser.OpenSubKey(scheme))Check(key==null,"owned handler retained");
   Check(!Directory.Exists(root),"owned installation files retained");
   Directory.CreateDirectory(root);File.WriteAllText(Path.Combine(root,"unrelated.txt"),"preserve");
   try{installation.Install(launcher,setup);throw new Exception("unowned directory overwritten");}catch(IOException){}
   Check(File.ReadAllText(Path.Combine(root,"unrelated.txt"))=="preserve","foreign files changed");
   Console.WriteLine("PASS: standalone installation without silent registration, manual Home visible outside repo, quoted path with spaces, URL Protocol, repair, atomic update, foreign-owner protection and owned uninstall.");return 0;
  }catch(Exception error){Console.Error.WriteLine(error);return 1;}
  finally {
   Registry.CurrentUser.DeleteSubKeyTree(keyPath,false);
   string allowed=Path.GetFullPath(Path.GetTempPath()).TrimEnd(Path.DirectorySeparatorChar)+Path.DirectorySeparatorChar;
   if(temp.StartsWith(allowed,StringComparison.OrdinalIgnoreCase)&&Path.GetFileName(temp)=="ASCEND installation test "+id&&Directory.Exists(temp))Directory.Delete(temp,true);
  }
 }
}
}
