using System;
using System.IO;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Win32;
namespace AscendLauncher {
internal sealed class FlowPlatform:IRiotPlatform {
 internal bool Existing,Missing;internal int Spawns,Focuses;
 public string FindClient(){if(Missing)throw new RiotNotFound();return @"E:\Riot Games\Riot Client\RiotClientServices.exe";}
 public void Verify(string p){}public bool Exists(string p){return p.EndsWith("Riot Client.exe");}
 public IntPtr FindWindow(IList<string> p,bool minimized){return Existing||Spawns>0?new IntPtr(123):IntPtr.Zero;}
 public void Focus(IntPtr w){Focuses++;}public int Spawn(string p,bool league){Spawns++;return 123;}public void Log(string text){}
}
internal static class FlowTests {
 static void Check(bool value,string text){if(!value)throw new Exception(text);}
 [STAThread] static int Main(string[] args) {
  int result=1;Application.EnableVisualStyles();Application.SetCompatibleTextRenderingDefault(false);
  using(var host=new Form{ShowInTaskbar=false,Opacity=0,Width=1,Height=1}) {
   host.Shown+=async delegate{try{await Run(args[0],args.Length==2&&args[1]=="--wall-clock");result=0;}catch(Exception error){Console.Error.WriteLine(error);}finally{host.Close();}};
   Application.Run(host);
  }return result;
 }
 static async Task Run(string releaseExe,bool wallClock) {
  string id=Guid.NewGuid().ToString("N"),root=Path.GetFullPath(Path.Combine(Path.GetTempPath(),"ASCEND-flow-"+id)),key=@"Software\ASCEND\FlowTests\"+id;
  Directory.CreateDirectory(root);string exe=Path.Combine(root,"AscendLauncher.exe");File.Copy(releaseExe,exe);
  var protocol=new ProtocolRegistration(exe,Registry.CurrentUser,key);double now=0;var clock=new AutoLaunchCountdown(delegate{return now;});
  try {
   Check(protocol.Read()==ProtocolState.NOT_INSTALLED,"first run state");
   using(var home=new LauncherForm(new string[0],new FlowPlatform(),null,protocol,clock)){home.Show();await Task.Delay(50);Check(home.CurrentState==LauncherState.HOME&&!clock.Active,"manual start launched countdown");Check(protocol.Read()==ProtocolState.NOT_INSTALLED,"manual start registered silently");home.Close();}
   protocol.Install();Check(protocol.Read()==ProtocolState.INSTALLED,"install verify");
   using(var cmd=Registry.CurrentUser.OpenSubKey(key+@"\ascendriot\shell\open\command",true))cmd.SetValue("","\"C:\\old\\AscendLauncher.exe\" \"%1\"");
   Check(protocol.Read()==ProtocolState.BROKEN,"old path not broken");protocol.Install();Check(protocol.Read()==ProtocolState.INSTALLED,"repair failed");
   using(var http=Registry.CurrentUser.CreateSubKey(key+@"\http"))http.SetValue("sentinel","preserve");
   using(var own=Registry.CurrentUser.CreateSubKey(key+@"\ascend"))own.SetValue("Owner",ProtocolRegistration.Owner);
   using(var foreign=Registry.CurrentUser.CreateSubKey(key+@"\ascendgame"))foreign.SetValue("Owner","other app");
   Check(protocol.RemoveAll()!=null,"conflict not reported");Check(protocol.Read()==ProtocolState.NOT_INSTALLED,"owned handler retained");
   using(var http=Registry.CurrentUser.OpenSubKey(key+@"\http"))Check((string)http.GetValue("sentinel")=="preserve","http altered");
   using(var foreign=Registry.CurrentUser.OpenSubKey(key+@"\ascendgame"))Check((string)foreign.GetValue("Owner")=="other app","foreign scheme removed");
   Check(File.Exists(exe),"remove deleted EXE");protocol.Install();Check(protocol.Read()==ProtocolState.INSTALLED,"reinstall failed");
   var canceled=new FlowPlatform();clock=new AutoLaunchCountdown(delegate{return now;});
   using(var form=new LauncherForm(new string[0],canceled,null,protocol,clock)){form.Show();await Task.Delay(30);await form.HandleRequest("ascendriot://open/league");Check(form.CurrentState==LauncherState.COUNTDOWN&&clock.Remaining==60&&canceled.Spawns==0,"web countdown did not start at 60");now+=1;await form.TickCountdown();Check(clock.Remaining==59&&canceled.Spawns==0,"59-second tick");form.Home();now+=100;await form.TickCountdown();Check(form.CurrentState==LauncherState.HOME&&canceled.Spawns==0&&!clock.Active,"cancel opened Riot");form.Close();}
   var immediate=new FlowPlatform();clock=new AutoLaunchCountdown(delegate{return now;});
   using(var form=new LauncherForm(new string[0],immediate,null,protocol,clock)){form.Show();await Task.Delay(30);await form.HandleRequest("ascendriot://open/riot");await form.Launch();Check(!clock.Active&&immediate.Spawns==1,"open now duplicate/delayed");}
   var automatic=new FlowPlatform();clock=new AutoLaunchCountdown(delegate{return now;});
   using(var form=new LauncherForm(new string[0],automatic,null,protocol,clock)){form.Show();await Task.Delay(30);await form.HandleRequest("ascendriot://open/riot");now+=59;await form.TickCountdown();Check(automatic.Spawns==0&&clock.Remaining==1,"launched early");now+=1;await form.TickCountdown();await form.TickCountdown();Check(automatic.Spawns==1&&!clock.Active,"expiry duplicate/missing launch");}
   var running=new FlowPlatform{Existing=true};clock=new AutoLaunchCountdown(delegate{return now;});
   using(var form=new LauncherForm(new string[0],running,null,protocol,clock)){form.Show();await Task.Delay(30);await form.HandleRequest("ascendriot://open/league");Check(running.Spawns==0&&running.Focuses==1&&!clock.Active,"existing Riot did not skip countdown");}
   var appears=new FlowPlatform();clock=new AutoLaunchCountdown(delegate{return now;});
   using(var form=new LauncherForm(new string[0],appears,null,protocol,clock)){form.Show();await Task.Delay(30);await form.HandleRequest("ascendriot://open/riot");appears.Existing=true;await form.TickCountdown();Check(appears.Spawns==0&&appears.Focuses==1&&!clock.Active,"Riot appearing mid-countdown ignored");}
   var missing=new FlowPlatform{Missing=true};
   using(var form=new LauncherForm(new string[0],missing,null,protocol)){form.Show();await Task.Delay(30);await form.HandleRequest("ascendriot://open/riot");Check(form.CurrentState==LauncherState.RIOT_NOT_FOUND&&!form.IsDisposed&&missing.Spawns==0,"missing client closed/spawned");form.Close();}
   var removed=new FlowPlatform();clock=new AutoLaunchCountdown(delegate{return now;});
   using(var form=new LauncherForm(new string[0],removed,null,protocol,clock)){form.Show();await Task.Delay(30);await form.HandleRequest("ascendriot://open/riot");removed.Missing=true;now+=60;await form.TickCountdown();Check(form.CurrentState==LauncherState.RIOT_NOT_FOUND&&!form.IsDisposed&&removed.Spawns==0&&!clock.Active,"client removed during countdown not recovered");form.Close();}
   var forwarded=new FlowPlatform();clock=new AutoLaunchCountdown(delegate{return now;});
   using(var form=new LauncherForm(new string[0],forwarded,null,protocol,clock)){form.Show();await Task.Delay(30);Native.ForwardRequest(form.Handle,"ascendriot://open/riot");await Task.Delay(80);Check(clock.Active&&form.CurrentState==LauncherState.COUNTDOWN,"existing Home did not receive URI");now+=1;await form.TickCountdown();Native.ForwardRequest(form.Handle,"ascendriot://open/riot");await Task.Delay(50);Check(clock.Remaining==59&&forwarded.Spawns==0,"duplicate URI reset countdown");form.Close();now+=100;await form.TickCountdown();Check(!clock.Active&&forwarded.Spawns==0,"close did not stop countdown");}
   if(wallClock){var realTime=new FlowPlatform();clock=new AutoLaunchCountdown();using(var form=new LauncherForm(new string[0],realTime,null,protocol,clock)){form.ShowInTaskbar=false;form.Opacity=0;form.Show();await Task.Delay(30);await form.HandleRequest("ascendriot://open/riot");var watch=System.Diagnostics.Stopwatch.StartNew();while(!form.IsDisposed&&watch.Elapsed.TotalSeconds<70){await Task.Delay(10000);Console.WriteLine("WALL CLOCK seconds="+(int)watch.Elapsed.TotalSeconds+" remaining="+clock.Remaining+" spawns="+realTime.Spawns);}Check(form.IsDisposed&&realTime.Spawns==1&&watch.Elapsed.TotalSeconds>=60,"real 60-second timer failed");Console.WriteLine("PASS: real monotonic 60-second WinForms countdown, automatic launch and auto-close; no real Riot spawned.");}}
   Console.WriteLine("PASS: manual first run, explicit install, broken/repair, ASCEND-only removal/conflict/reinstall, 60→59→1→0 countdown, cancel, open now, expiry once, existing/mid-countdown Riot focus and missing-client UI. Registry tests isolated; no real Riot spawned.");
  }finally{Registry.CurrentUser.DeleteSubKeyTree(key,false);string allowed=Path.GetFullPath(Path.GetTempPath()).TrimEnd(Path.DirectorySeparatorChar)+Path.DirectorySeparatorChar;if(root.StartsWith(allowed,StringComparison.OrdinalIgnoreCase)&&Path.GetFileName(root)=="ASCEND-flow-"+id&&Directory.Exists(root))Directory.Delete(root,true);}
 }
}
}
