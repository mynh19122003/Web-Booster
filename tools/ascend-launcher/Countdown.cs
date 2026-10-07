using System;
using System.Diagnostics;
namespace AscendLauncher {
internal enum LauncherState { HOME,INSTALLING_PROTOCOL,COUNTDOWN,FINDING_RIOT,RIOT_NOT_FOUND,LAUNCHING_RIOT,WAITING_FOR_RIOT,SUCCESS,ERROR }
internal sealed class AutoLaunchCountdown {
 internal const int RIOT_AUTO_LAUNCH_DELAY_SECONDS=60;
 readonly Func<double> clock;double started;
 internal bool Active {get;private set;}
 internal int Remaining {get;private set;}
 internal AutoLaunchCountdown(Func<double> clock=null){this.clock=clock??delegate{return (double)Stopwatch.GetTimestamp()/Stopwatch.Frequency;};}
 internal void Start(){started=clock();Remaining=RIOT_AUTO_LAUNCH_DELAY_SECONDS;Active=true;}
 internal void Stop(){Active=false;}
 internal bool Tick(){if(!Active)return false;Remaining=Math.Max(0,(int)Math.Ceiling(RIOT_AUTO_LAUNCH_DELAY_SECONDS-(clock()-started)));if(Remaining>0)return false;Active=false;return true;}
}
}
