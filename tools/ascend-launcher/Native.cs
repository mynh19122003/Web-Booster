using System;
using System.Text;
using System.IO;
using System.ComponentModel;
using System.Runtime.InteropServices;
using System.Security.Cryptography.X509Certificates;
using System.Text.RegularExpressions;

namespace AscendLauncher {
internal static class Native {
 internal delegate bool EnumProc(IntPtr window, IntPtr data);
 [DllImport("user32.dll")] internal static extern bool EnumWindows(EnumProc callback, IntPtr data);
 [DllImport("user32.dll")] internal static extern bool IsWindowVisible(IntPtr h);
 [DllImport("user32.dll")] internal static extern bool IsIconic(IntPtr h);
 [DllImport("user32.dll")] internal static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
 [DllImport("user32.dll")] internal static extern bool ShowWindowAsync(IntPtr h, int command);
 [DllImport("user32.dll")] internal static extern bool SetForegroundWindow(IntPtr h);
 [DllImport("user32.dll", CharSet=CharSet.Unicode)] internal static extern int GetWindowText(IntPtr h, StringBuilder title, int size);
 [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
 struct StartupInfo { public int cb; public string reserved,desktop,title; public int x,y,xSize,ySize,xChars,yChars,fill,flags; public short show,reservedSize; public IntPtr reservedData,input,output,error; }
 [StructLayout(LayoutKind.Sequential)] struct ProcessInfo { public IntPtr process,thread; public int pid,tid; }
 [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)]
 static extern bool CreateProcessW(string application, StringBuilder command, IntPtr pa, IntPtr ta, bool inherit, uint flags, IntPtr environment, string directory, ref StartupInfo startup, out ProcessInfo process);
 [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr handle);
 internal static int Spawn(string path, bool league) {
  var command=new StringBuilder("\""+path+"\"");
  if(league) command.Append(" --launch-product=league_of_legends --launch-patchline=live");
  var si=new StartupInfo(); si.cb=Marshal.SizeOf(si); si.flags=1; si.show=1;
  ProcessInfo pi;
  string old=Environment.GetEnvironmentVariable("ELECTRON_RUN_AS_NODE");
  try {
   Environment.SetEnvironmentVariable("ELECTRON_RUN_AS_NODE",null);
   if(!CreateProcessW(path,command,IntPtr.Zero,IntPtr.Zero,false,8,IntPtr.Zero,Path.GetDirectoryName(path),ref si,out pi)) throw new Win32Exception(Marshal.GetLastWin32Error());
   try { return pi.pid; } finally { CloseHandle(pi.thread); CloseHandle(pi.process); }
  } finally { Environment.SetEnvironmentVariable("ELECTRON_RUN_AS_NODE",old); }
 }
 [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)] struct TrustFile { public uint size; public string path; public IntPtr file,subject; }
 [StructLayout(LayoutKind.Sequential)] struct TrustData { public uint size; public IntPtr policy,sip; public uint ui,revoke,choice; public IntPtr file; public uint state; public IntPtr stateData,url; public uint flags,context; public IntPtr signature; }
 [DllImport("wintrust.dll", ExactSpelling=true)] static extern int WinVerifyTrust(IntPtr window, ref Guid action, ref TrustData data);
 internal static void Verify(string path) {
  if(!File.Exists(path)) throw new LauncherError("Không tìm thấy Riot Client. Kiểm tra cài đặt Riot Client.");
  var file=new TrustFile {size=(uint)Marshal.SizeOf(typeof(TrustFile)),path=path};
  var pointer=Marshal.AllocHGlobal(Marshal.SizeOf(file));
  Marshal.StructureToPtr(file,pointer,false);
  var data=new TrustData {size=(uint)Marshal.SizeOf(typeof(TrustData)),ui=2,choice=1,file=pointer,state=1,flags=0x1000};
  var action=new Guid("00AAC56B-CD44-11d0-8CC2-00C04FC295EE");
  try {
   int result=WinVerifyTrust(new IntPtr(-1),ref action,ref data);
   if(result!=0) throw new LauncherError("Không thể xác minh chữ ký Riot Client. Không mở file này.");
   using(var certificate=new X509Certificate2(X509Certificate.CreateFromSignedFile(path))) {
    if(!Regex.IsMatch(certificate.Subject,@"(?:^|,\s*)O=""?Riot Games(?:,? Inc\.?)?""?(?:,|$)")) throw new LauncherError("File đã chọn không do Riot Games phát hành.");
   }
  } finally {
   data.state=2; WinVerifyTrust(new IntPtr(-1),ref action,ref data);
   Marshal.DestroyStructure(pointer,typeof(TrustFile)); Marshal.FreeHGlobal(pointer);
  }
 }
}
}
