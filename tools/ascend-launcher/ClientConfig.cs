using System;
using System.IO;
using System.Collections.Generic;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Json;

namespace AscendLauncher {
internal sealed class RiotNotFound:LauncherError {
 internal RiotNotFound():base("Không tìm thấy Riot Client"){}
}
[DataContract] internal sealed class ClientSettings {
 [DataMember(Name="riotClientPath")] public string Path;
}
internal sealed class ClientConfig {
 internal readonly string FilePath;
 readonly Action<string> verify;
 internal ClientConfig(string path,Action<string> verify) { FilePath=path; this.verify=verify; }
 internal static string DefaultPath { get { return System.IO.Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"ASCEND","launcher-config.json"); } }
 internal string Validate(string path) {
  if(String.IsNullOrWhiteSpace(path) || !System.IO.Path.IsPathRooted(path) || System.IO.Path.GetPathRoot(path).Length<3 || !String.Equals(System.IO.Path.GetFileName(path),"RiotClientServices.exe",StringComparison.OrdinalIgnoreCase))
   throw new LauncherError("File đã chọn không phải RiotClientServices.exe.");
  path=System.IO.Path.GetFullPath(path);
  if(!File.Exists(path) || (File.GetAttributes(path)&(FileAttributes.Directory|FileAttributes.ReparsePoint))!=0) throw new LauncherError("Không thể đọc file RiotClientServices.exe đã chọn.");
  using(var stream=File.Open(path,FileMode.Open,FileAccess.Read,FileShare.Read)) {}
  verify(path); return path;
 }
 internal string Read() {
  try {
   if(!File.Exists(FilePath) || new FileInfo(FilePath).Length>16384) return null;
   using(var stream=File.OpenRead(FilePath)) { var value=(ClientSettings)new DataContractJsonSerializer(typeof(ClientSettings)).ReadObject(stream); return value==null ? null : value.Path; }
  } catch(IOException){} catch(UnauthorizedAccessException){} catch(SerializationException){} catch(System.Security.SecurityException){}
  return null;
 }
 internal string Find(IEnumerable<string> common,Func<string> metadata) {
  var candidates=new List<string>(); candidates.Add(Read()); candidates.AddRange(common);
  foreach(string candidate in candidates) { string valid=TryValidate(candidate); if(valid!=null)return valid; }
  string fallback=TryValidate(metadata()); if(fallback!=null)return fallback;
  throw new RiotNotFound();
 }
 string TryValidate(string path) {
  try { return Validate(path); } catch(LauncherError){} catch(IOException){} catch(UnauthorizedAccessException){} catch(ArgumentException){} catch(NotSupportedException){} catch(System.Security.SecurityException){} catch(System.Security.Cryptography.CryptographicException){}
  return null;
 }
 internal void Save(string path) {
  path=Validate(path);
  string parent=System.IO.Path.GetDirectoryName(FilePath);
  for(string dir=parent; !String.IsNullOrEmpty(dir); dir=System.IO.Path.GetDirectoryName(dir))
   if(Directory.Exists(dir) && (File.GetAttributes(dir)&FileAttributes.ReparsePoint)!=0) throw new LauncherError("Không thể lưu cấu hình vào thư mục chuyển hướng.");
  if(File.Exists(FilePath) && (File.GetAttributes(FilePath)&FileAttributes.ReparsePoint)!=0) throw new LauncherError("Không thể lưu cấu hình vào file chuyển hướng.");
  Directory.CreateDirectory(parent);
  string temp=FilePath+"."+Guid.NewGuid().ToString("N")+".tmp";
  try {
   using(var stream=new FileStream(temp,FileMode.CreateNew,FileAccess.Write,FileShare.None)) new DataContractJsonSerializer(typeof(ClientSettings)).WriteObject(stream,new ClientSettings{Path=path});
   if(File.Exists(FilePath)) File.Replace(temp,FilePath,null); else File.Move(temp,FilePath);
  } finally { if(File.Exists(temp)) File.Delete(temp); }
 }
}
}
