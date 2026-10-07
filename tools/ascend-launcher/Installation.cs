using System;
using System.IO;
using System.Text;
using System.Runtime.InteropServices;
using Microsoft.Win32;

namespace AscendLauncher {
internal sealed class LauncherInstallation {
 internal const string Owner="ASCEND.Launcher.v1",LegacyOwner="ASCEND.RiotLauncherPoC.v1";
 internal const string Scheme=@"Software\Classes\ascendriot";
 internal const string UninstallKey=@"Software\Microsoft\Windows\CurrentVersion\Uninstall\ASCENDLauncher";
 internal readonly string Root;
 readonly RegistryKey hive;
 readonly string scheme,uninstall;
 internal string Exe {get{return Path.Combine(Root,"AscendLauncher.exe");}}
 internal string Setup {get{return Path.Combine(Root,"AscendLauncherSetup.exe");}}
 internal string Command {get{return "\""+Exe+"\" \"%1\"";}}
 internal static string DefaultRoot {get{return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"ASCEND","Launcher");}}
 internal LauncherInstallation():this(DefaultRoot,Registry.CurrentUser,Scheme,UninstallKey){}
 internal LauncherInstallation(string root,RegistryKey hive,string scheme,string uninstall){Root=Path.GetFullPath(root);this.hive=hive;this.scheme=scheme;this.uninstall=uninstall;}
 [DllImport("shell32.dll")] static extern void SHChangeNotify(uint change,uint flags,IntPtr a,IntPtr b);
 void Notify(){SHChangeNotify(0x08000000,0,IntPtr.Zero,IntPtr.Zero);}
 static bool Linked(string path){return (File.Exists(path)||Directory.Exists(path)) && (File.GetAttributes(path)&FileAttributes.ReparsePoint)!=0;}
 void CheckRoot(bool require) {
  for(string dir=Root;!String.IsNullOrEmpty(dir);dir=Path.GetDirectoryName(dir)) if(Linked(dir)) throw new IOException("Thư mục cài đặt không được là liên kết.");
  string marker=Path.Combine(Root,".owner");
  if(Directory.Exists(Root) && (!File.Exists(marker)||Linked(marker)||File.ReadAllText(marker)!=Owner)) throw new IOException("Thư mục đã tồn tại không thuộc ASCEND Launcher. Không ghi đè.");
  if(require&&!Directory.Exists(Root))throw new IOException("ASCEND Launcher chưa được cài cho Windows user này.");
  foreach(string file in new[]{Exe,Setup}) if(Linked(file))throw new IOException("File cài đặt không được là liên kết.");
 }
 void CheckRegistration() {
  using(var key=hive.OpenSubKey(scheme)) {
   if(key==null && scheme==Scheme)using(var machine=Registry.LocalMachine.OpenSubKey(Scheme))if(machine!=null)throw new IOException("ascendriot đã đăng ký ở cấp máy. Không tự ghi đè bằng bản per-user.");
   if(key!=null && (string)key.GetValue("Owner","")!=Owner && (string)key.GetValue("Owner","")!=LegacyOwner)throw new IOException("ascendriot đã thuộc ứng dụng khác. Không ghi đè.");
  }
  using(var key=hive.OpenSubKey(uninstall)) if(key!=null && (string)key.GetValue("Owner","")!=Owner)throw new IOException("Mục gỡ cài đặt không thuộc ASCEND.");
 }
 static void WriteAtomic(string path,byte[] bytes) {
  string temp=path+"."+Guid.NewGuid().ToString("N")+".tmp";
  try {using(var stream=new FileStream(temp,FileMode.CreateNew,FileAccess.Write,FileShare.None))stream.Write(bytes,0,bytes.Length);
   if(File.Exists(path))File.Replace(temp,path,null);else File.Move(temp,path);
  } finally {if(File.Exists(temp))File.Delete(temp);}
 }
 internal void Install(byte[] launcher,byte[] setup) {
  if(!Environment.Is64BitOperatingSystem)throw new IOException("Bản này yêu cầu Windows x64.");
  CheckRegistration(); CheckRoot(false);
  Directory.CreateDirectory(Root); File.WriteAllText(Path.Combine(Root,".owner"),Owner);
  WriteAtomic(Exe,launcher);
  if(!String.Equals(System.Reflection.Assembly.GetExecutingAssembly().Location,Setup,StringComparison.OrdinalIgnoreCase))WriteAtomic(Setup,setup);
  RegisterUninstall();
 }
 internal void Repair() {
  CheckRegistration();CheckRoot(true);
  if(!File.Exists(Exe)||!File.Exists(Setup))throw new IOException("Thiếu file cài đặt. Hãy chạy lại bộ cài ASCEND.");
  using(var key=hive.CreateSubKey(scheme)) {
   key.SetValue("","URL:ASCEND Riot Launcher");key.SetValue("URL Protocol","");key.SetValue("Owner",Owner);
   using(var icon=key.CreateSubKey("DefaultIcon"))icon.SetValue("","\""+Exe+"\",0");
   using(var command=key.CreateSubKey(@"shell\open\command"))command.SetValue("",Command);
  }
  RegisterUninstall();
  Notify();
 }
 void RegisterUninstall() {
  using(var key=hive.CreateSubKey(uninstall)) {
   key.SetValue("Owner",Owner);key.SetValue("DisplayName","ASCEND Launcher");key.SetValue("DisplayVersion",Release.Version);
   key.SetValue("Publisher","ASCEND");key.SetValue("InstallLocation",Root);key.SetValue("DisplayIcon",Exe+",0");
   key.SetValue("UninstallString","\""+Setup+"\" --uninstall");key.SetValue("ModifyPath","\""+Setup+"\" --repair");
   key.SetValue("NoModify",0,RegistryValueKind.DWord);key.SetValue("NoRepair",0,RegistryValueKind.DWord);
  }
 }
 internal void Uninstall() {
  CheckRoot(true);
  // Remove only this owner's exact active command. Preserve handlers subsequently installed by another application.
  using(var key=hive.OpenSubKey(scheme)) using(var command=hive.OpenSubKey(scheme+@"\shell\open\command")) {
   if(key!=null && (string)key.GetValue("Owner","")==Owner && command!=null && (string)command.GetValue("","")==Command)hive.DeleteSubKeyTree(scheme,false);
  }
  using(var key=hive.OpenSubKey(uninstall)) if(key!=null&&(string)key.GetValue("Owner","")==Owner)hive.DeleteSubKeyTree(uninstall,false);
  foreach(string file in new[]{Exe,Setup})if(File.Exists(file))File.Delete(file);
  // Retain unexpected files and the user's Riot path configuration.
  if(Directory.GetFileSystemEntries(Root).Length==1) {File.Delete(Path.Combine(Root,".owner"));Directory.Delete(Root,false);}
  Notify();
 }
 internal string Diagnostics() {
  var text=new StringBuilder("ASCEND Launcher "+Release.Version+Environment.NewLine);
  text.AppendLine("Windows x64: "+Environment.Is64BitOperatingSystem);text.AppendLine("CLR: "+Environment.Version);
  text.AppendLine("Installed EXE: "+Exe);text.AppendLine("EXE exists: "+File.Exists(Exe));
  using(var key=hive.OpenSubKey(scheme))using(var command=hive.OpenSubKey(scheme+@"\shell\open\command")) {
   text.AppendLine("HKCU protocol exists: "+(key!=null));
   text.AppendLine("URL Protocol present: "+(key!=null&&Array.IndexOf(key.GetValueNames(),"URL Protocol")>=0));
   string value=command==null?"":command.GetValue("","") as string;
   text.AppendLine("Registry command: "+value);text.AppendLine("Command matches installation: "+(value==Command));
  }
  text.AppendLine("Config: "+ClientConfig.DefaultPath);
  text.AppendLine("Development build: unsigned ASCEND EXE. Browser/SmartScreen confirmation must be handled by the user.");
  text.AppendLine("Browser state and the second PC are not observable here. Test ascendriot://test before testing Riot.");
  return text.ToString();
 }
}
}
