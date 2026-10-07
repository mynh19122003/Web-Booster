using System;
using System.IO;
using System.Collections.Generic;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Win32;

namespace AscendLauncher {
internal enum LaunchState { STARTING,FINDING_RIOT,LAUNCHING,WAITING_FOR_WINDOW,SUCCESS,ERROR }
internal class LauncherError:Exception { internal LauncherError(string message):base(message){} }
internal interface IRiotPlatform {
 string FindClient(); void Verify(string path); bool Exists(string path);
 IntPtr FindWindow(IList<string> paths, bool allowMinimized); void Focus(IntPtr window);
 int Spawn(string path,bool league); void Log(string message);
}
internal sealed class LauncherEngine {
 internal const int TimeoutMilliseconds=30000;
 readonly IRiotPlatform platform;
 readonly int timeout;
 DateTime lastLaunch=DateTime.MinValue;
 internal LauncherEngine(IRiotPlatform platform,int timeout=TimeoutMilliseconds) { this.platform=platform; this.timeout=timeout; }
 internal static bool ValidRequest(string[] args) { return args.Length==1 && (args[0]=="ascendriot://open/league" || args[0]=="ascendriot://open/riot"); }
 internal async Task Run(string action, Action<LaunchState,string> state, CancellationToken cancel) {
  var duration=Stopwatch.StartNew();
  state(LaunchState.FINDING_RIOT,"Đang tìm Riot Client...");
  string client=platform.FindClient(); platform.Verify(client);
  string root=Path.GetDirectoryName(client);
  var paths=new List<string>();
  string ui=Path.Combine(root,"RiotClientElectron","Riot Client.exe");
  if(platform.Exists(ui)) { platform.Verify(ui); paths.Add(ui); } else ui=null;
  string legacy=Path.Combine(root,"UX","RiotClientUx.exe");
  if(platform.Exists(legacy)) { platform.Verify(legacy); paths.Add(legacy); }
  if(paths.Count==0) paths.Add(client);
  platform.Log("action="+action+" riotPath="+client);
  cancel.ThrowIfCancellationRequested();
  IntPtr window=platform.FindWindow(paths,true);
  if(window!=IntPtr.Zero) {
   platform.Focus(window);
   state(LaunchState.WAITING_FOR_WINDOW,"Riot Client đang chạy.");
  } else if((DateTime.UtcNow-lastLaunch).TotalSeconds>=8) {
   state(LaunchState.LAUNCHING,"Đang mở Riot Client...");
   lastLaunch=DateTime.UtcNow;
   // Preserve the installed League shortcut flags and modern Electron UI recovery.
   if(action=="ascendriot://open/league" || ui==null) {
    platform.Log("serviceSpawnPid="+platform.Spawn(client,action=="ascendriot://open/league"));
    if(ui!=null) await Task.Delay(1000,cancel);
   }
   if(ui!=null) platform.Log("uiSpawnPid="+platform.Spawn(ui,false));
  }
  state(LaunchState.WAITING_FOR_WINDOW,"Đang chờ Riot Client...");
  var wait=Stopwatch.StartNew();
  while(wait.ElapsedMilliseconds<timeout) {
   cancel.ThrowIfCancellationRequested();
   window=platform.FindWindow(paths,false);
   if(window!=IntPtr.Zero) {
    platform.Log("VISIBLE_WINDOW_FOUND handle="+window.ToInt64()+" durationMs="+duration.ElapsedMilliseconds);
    state(LaunchState.SUCCESS,"Riot Client đã sẵn sàng"); return;
   }
   await Task.Delay(200,cancel);
  }
  platform.Log("VISIBLE_WINDOW_TIMEOUT durationMs="+duration.ElapsedMilliseconds);
  throw new LauncherError("Không thể mở Riot Client. Kiểm tra Riot Client đã được cài đặt.");
 }
}
internal sealed class WindowsRiotPlatform:IRiotPlatform {
 internal const string Owner="ASCEND.RiotLauncherPoC.v1";
 readonly int session=Process.GetCurrentProcess().SessionId;
 internal readonly ClientConfig Config=new ClientConfig(ClientConfig.DefaultPath,Native.Verify);
 public string FindClient() {
  var candidates=new List<string>();
  foreach(string root in new[]{Path.GetPathRoot(Environment.SystemDirectory),Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86),@"C:\",@"D:\",@"E:\"}) {
   if(!String.IsNullOrEmpty(root)) candidates.Add(Path.Combine(root,"Riot Games","Riot Client","RiotClientServices.exe"));
  }
  return Config.Find(candidates,delegate {
   using(var key=Registry.CurrentUser.OpenSubKey(@"Software\ASCEND\RiotLauncherPoC")) {
    if(key==null) return null;
    if((string)key.GetValue("Owner","")!=Owner) throw new LauncherError("Cấu hình launcher không thuộc ASCEND.");
    return key.GetValue("ClientPath",null) as string;
   }
  });
 } public void Verify(string path) { Native.Verify(path); }
 public bool Exists(string path) { return File.Exists(path); }
 public IntPtr FindWindow(IList<string> paths,bool allowMinimized) {
  IntPtr found=IntPtr.Zero;
  Native.EnumWindows(delegate(IntPtr window,IntPtr unused) {
   if(!Native.IsWindowVisible(window) || (!allowMinimized && Native.IsIconic(window))) return true;
   uint id; Native.GetWindowThreadProcessId(window,out id);
   try { using(var process=Process.GetProcessById((int)id)) {
    if(process.SessionId!=session) return true;
    string path=process.MainModule.FileName;
    foreach(string verified in paths) if(String.Equals(verified,path,StringComparison.OrdinalIgnoreCase)) { found=window; return false; }
   }} catch(InvalidOperationException){} catch(System.ComponentModel.Win32Exception){} catch(NotSupportedException){}
   return true;
  },IntPtr.Zero);
  return found;
 }
 public void Focus(IntPtr window) { Native.ShowWindowAsync(window,9); Log("foreground="+Native.SetForegroundWindow(window)); }
 public int Spawn(string path,bool league) { Native.Verify(path); return Native.Spawn(path,league); }
 public void Log(string message) {
  try {
   using(var key=Registry.CurrentUser.OpenSubKey(@"Software\ASCEND\RiotLauncherPoC")) {
    if(key==null || (string)key.GetValue("Owner","")!=Owner || Convert.ToInt32(key.GetValue("DiagnosticsEnabled",0))!=1) return;
   }
   string parent=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"ASCEND");
   string dir=Path.Combine(parent,"RiotLauncherPoC"); string log=Path.Combine(dir,"launcher.log");
   foreach(string path in new[]{parent,dir,log,Path.Combine(dir,".owner")}) if((Directory.Exists(path)||File.Exists(path)) && (File.GetAttributes(path)&FileAttributes.ReparsePoint)!=0) return;
   if(!File.Exists(Path.Combine(dir,".owner")) || File.ReadAllText(Path.Combine(dir,".owner"))!=Owner) return;
   File.AppendAllText(log,DateTime.UtcNow.ToString("o")+" nativePid="+Process.GetCurrentProcess().Id+" "+message+Environment.NewLine);
  } catch(IOException){} catch(UnauthorizedAccessException){} catch(System.Security.SecurityException){}
 }
}
}
