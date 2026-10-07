using System;
using System.IO;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using Microsoft.Win32;
namespace AscendLauncher {
internal enum ProtocolState { NOT_INSTALLED,INSTALLED,BROKEN }
internal sealed class ProtocolRegistration {
 internal const string Owner="ASCEND.Launcher.v1";
 internal static readonly string[] OwnedSchemes={"ascendriot","ascend","ascendgame"};
 readonly RegistryKey hive;readonly string classes;
 internal readonly string Exe;
 internal string Command {get{return "\""+Exe+"\" \"%1\"";}}
 internal string Conflict {get;private set;}
 internal ProtocolRegistration():this(System.Reflection.Assembly.GetExecutingAssembly().Location,Registry.CurrentUser,@"Software\Classes"){}
 internal ProtocolRegistration(string exe,RegistryKey hive,string classes){Exe=Path.GetFullPath(exe);this.hive=hive;this.classes=classes;}
 [DllImport("shell32.dll")] static extern void SHChangeNotify(uint e,uint f,IntPtr a,IntPtr b);
 void Notify(){SHChangeNotify(0x08000000,0,IntPtr.Zero,IntPtr.Zero);}
 bool Owned(RegistryKey key,string command) {
  string owner=key.GetValue("Owner","") as string;
  if(!String.IsNullOrEmpty(owner)&&owner!=Owner&&owner!="ASCEND.RiotLauncherPoC.v1")return false;
  return owner==Owner||owner=="ASCEND.RiotLauncherPoC.v1"||String.Equals(command,Command,StringComparison.OrdinalIgnoreCase);
 }
 internal ProtocolState Read() {
  Conflict=null;
  using(var key=hive.OpenSubKey(classes+@"\ascendriot"))using(var command=hive.OpenSubKey(classes+@"\ascendriot\shell\open\command")) {
   if(key==null) {
    if(classes==@"Software\Classes")using(var machine=Registry.LocalMachine.OpenSubKey(@"Software\Classes\ascendriot"))if(machine!=null){Conflict="Giao thức đang thuộc bản cài cấp máy. Không tự ghi đè.";return ProtocolState.BROKEN;}
    return ProtocolState.NOT_INSTALLED;
   }
   string value=command==null?"":command.GetValue("","") as string;
   if(!Owned(key,value)){Conflict="Giao thức ascendriot đang thuộc ứng dụng khác. Không ghi đè hoặc xóa.";return ProtocolState.BROKEN;}
   bool marked=Array.IndexOf(key.GetValueNames(),"URL Protocol")>=0&&key.GetValue("URL Protocol") is string;
   return marked&&File.Exists(Exe)&&String.Equals(value,Command,StringComparison.OrdinalIgnoreCase) ? ProtocolState.INSTALLED : ProtocolState.BROKEN;
  }
 }
 internal void Install() {
  Read();if(Conflict!=null)throw new LauncherError(Conflict);
  if(!File.Exists(Exe)||!String.Equals(Path.GetFileName(Exe),"AscendLauncher.exe",StringComparison.OrdinalIgnoreCase))throw new LauncherError("Không tìm thấy AscendLauncher.exe hiện tại.");
  using(var key=hive.CreateSubKey(classes+@"\ascendriot")) {
   key.SetValue("","URL:ASCEND Riot Launcher");key.SetValue("URL Protocol","");key.SetValue("Owner",Owner);
   using(var icon=key.CreateSubKey("DefaultIcon"))icon.SetValue("","\""+Exe+"\",0");
   using(var command=key.CreateSubKey(@"shell\open\command")){command.SetValue("",Command);command.DeleteValue("DelegateExecute",false);}
  }
  Notify();if(Read()!=ProtocolState.INSTALLED)throw new LauncherError("Không thể xác minh giao thức sau khi cài.");
 }
 internal string RemoveAll() {
  var conflicts=new List<string>();
  foreach(string name in OwnedSchemes) {
   string path=classes+"\\"+name;bool remove=false;
   using(var key=hive.OpenSubKey(path))using(var command=hive.OpenSubKey(path+@"\shell\open\command")) {
    if(key==null)continue;
    if(Owned(key,command==null?"":command.GetValue("","") as string))remove=true;else conflicts.Add(name);
   }
   if(remove)hive.DeleteSubKeyTree(path,false);
  }
  Notify();Read();return conflicts.Count==0 ? null : "Không xóa giao thức thuộc ứng dụng khác: "+String.Join(", ",conflicts.ToArray());
 }
}
}
