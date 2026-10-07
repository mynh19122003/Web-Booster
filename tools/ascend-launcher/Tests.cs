using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;

namespace AscendLauncher {
internal sealed class FakePlatform:IRiotPlatform {
 internal bool missing,badSignature,existing;
 internal int spawns,focus,checks,visibleAfter=2;
 internal readonly List<bool> leagueFlags=new List<bool>();
 public string FindClient(){ if(missing) throw new LauncherError("missing"); return @"E:\Riot Games\Riot Client\RiotClientServices.exe"; }
 public void Verify(string path){ if(badSignature) throw new LauncherError("signature"); }
 public bool Exists(string path){ return path.EndsWith("Riot Client.exe"); }
 public IntPtr FindWindow(IList<string> paths,bool minimized){ checks++; return existing || (!minimized && checks>=visibleAfter) ? new IntPtr(123) : IntPtr.Zero; }
 public void Focus(IntPtr window){focus++;}
 public int Spawn(string path,bool league){spawns++; leagueFlags.Add(league);return 123;}
 public void Log(string message){}
}
internal static class Tests {
 static void Check(bool value,string message){if(!value)throw new Exception(message);}
 static void Run(FakePlatform p,string action,int timeout=1000){ new LauncherEngine(p,timeout).Run(action,delegate{},CancellationToken.None).GetAwaiter().GetResult(); }
 static int Main(){
  try {
   ConfigTests();
   foreach(string uri in new[]{"ascendriot://test","ascendriot://test/"}){var selfTest=new FakePlatform{missing=true,badSignature=true};Run(selfTest,uri);Check(selfTest.spawns==0&&selfTest.checks==0,"self-test touched Riot");}
   foreach(string uri in new[]{"ascendriot://test?x=1","ascendriot://test/#x","ascendriot://test//","ascendriot://test/extra","ascendriot://TEST"})Check(!LauncherEngine.ValidRequest(new[]{uri}),"self-test allowlist widened");
   string[] rejected={"","ASCENDRIOT://open/league","ascendriot://open/league/","ascendriot://open/league?x=1","ascendriot://open/league#x","ascendriot://open/%6ceague","ascendriot://open/x/../league","ascendriot://run/calc","ascendriot://open/riot\n"};
   foreach(string value in rejected) Check(!LauncherEngine.ValidRequest(new[]{value}),"URI accepted");
   Check(!LauncherEngine.ValidRequest(new string[0])&&!LauncherEngine.ValidRequest(new[]{"ascendriot://open/riot","extra"}),"argument count");
   Check(LauncherEngine.ValidRequest(new[]{"ascendriot://test"})&&LauncherEngine.ValidRequest(new[]{"ascendriot://open/riot"})&&LauncherEngine.ValidRequest(new[]{"ascendriot://open/league"}),"allowlist");
   var existing=new FakePlatform{existing=true}; Run(existing,"ascendriot://open/league"); Check(existing.spawns==0&&existing.focus==1,"existing window duplicated");
   var cold=new FakePlatform(); Run(cold,"ascendriot://open/league"); Check(cold.spawns==2&&cold.leagueFlags[0]&&!cold.leagueFlags[1],"League fixed mapping");
   var riot=new FakePlatform(); Run(riot,"ascendriot://open/riot"); Check(riot.spawns==1&&!riot.leagueFlags[0],"Riot UI mapping");
   var missing=new FakePlatform{missing=true}; try{Run(missing,"ascendriot://open/riot");throw new Exception("missing accepted");}catch(LauncherError){} Check(missing.spawns==0,"missing spawned");
   var bad=new FakePlatform{badSignature=true};try{Run(bad,"ascendriot://open/riot");throw new Exception("signature accepted");}catch(LauncherError){} Check(bad.spawns==0,"bad publisher spawned");
   var ghost=new FakePlatform{visibleAfter=Int32.MaxValue};var engine=new LauncherEngine(ghost,1);
   for(int i=0;i<2;i++)try{engine.Run("ascendriot://open/riot",delegate{},CancellationToken.None).GetAwaiter().GetResult();throw new Exception("ghost treated as success");}catch(LauncherError){}
   Check(ghost.spawns==1,"retry spawned too quickly");
   string fixture=Path.Combine(Path.GetTempPath(),"ASCEND-signature-"+Guid.NewGuid().ToString("N")+".exe");
   try {
    File.WriteAllText(fixture,"unsigned test fixture");
    try{Native.Verify(fixture);throw new Exception("unsigned accepted");}catch(LauncherError){}
    File.Copy(Path.Combine(Environment.SystemDirectory,"WindowsPowerShell","v1.0","powershell.exe"),fixture,true);
    try{Native.Verify(fixture);throw new Exception("Microsoft publisher accepted");}catch(LauncherError){}
   } finally {File.Delete(fixture);}
   Console.WriteLine("PASS: strict URI parsing, visible/existing window, fixed launch mappings, missing client, bad signatures, timeout, retry throttling, real unsigned/non-Riot refusal.");return 0;
  }catch(Exception e){Console.Error.WriteLine(e);return 1;}
 }
 static void ConfigTests() {
  string root=Path.Combine(Path.GetTempPath(),"ASCEND-config-"+Guid.NewGuid().ToString("N"));
  Directory.CreateDirectory(root);
  string custom=Path.Combine(root,"custom","RiotClientServices.exe"),common=Path.Combine(root,"common","RiotClientServices.exe");
  Directory.CreateDirectory(Path.GetDirectoryName(custom)); Directory.CreateDirectory(Path.GetDirectoryName(common));
  File.WriteAllText(custom,"fixture"); File.WriteAllText(common,"fixture");
  try {
   var config=new ClientConfig(Path.Combine(root,"launcher-config.json"),delegate{});
   Check(config.Find(new[]{common},delegate{return custom;})==common,"common detection priority");
   try {config.Find(new string[0],delegate{return null;});throw new Exception("missing did not request picker");} catch(RiotNotFound){}
   foreach(string name in new[]{"notepad.exe","powershell.exe","cmd.exe","client.bat","client.ps1","client.com","client.scr","RiotClientServices.exe.lnk"}) {
    string path=Path.Combine(root,name); File.WriteAllText(path,"fixture");
    try {config.Save(path);throw new Exception("wrong filename saved");} catch(LauncherError e){Check(e.Message=="File đã chọn không phải RiotClientServices.exe.","wrong file message");}
   }
   Check(!File.Exists(config.FilePath),"invalid selection persisted");
   config.Save(custom); Check(config.Read()==custom,"custom persistence");
   config.Save(common); Check(config.Read()==common,"atomic replacement"); config.Save(custom);
   Check(new ClientConfig(config.FilePath,delegate{}).Find(new[]{common},delegate{return null;})==custom,"saved reuse priority");
   File.Delete(custom); Check(config.Find(new[]{common},delegate{return null;})==common,"invalid saved recovery");
   File.WriteAllText(config.FilePath,"invalid JSON"); Check(config.Find(new[]{common},delegate{return null;})==common,"corrupt config recovery");
   File.WriteAllText(config.FilePath,"null"); Check(config.Find(new[]{common},delegate{return null;})==common,"null config recovery");
   File.WriteAllText(custom,"fixture"); var untrusted=new ClientConfig(config.FilePath,delegate{throw new LauncherError("signature");});
   try {untrusted.Save(custom);throw new Exception("unsigned selection saved");} catch(LauncherError){}
   Console.WriteLine("PASS: common detection, missing fallback, rejected filenames, custom persistence, saved priority, deleted/corrupt config recovery, signature before save.");
  } finally {Directory.Delete(root,true);}
 }
}
}
