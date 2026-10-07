import Image from "next/image";
interface AscendLogoProps {
 variant?: "icon" | "horizontal" | "full";
 size?: "sm" | "md" | "lg" | "xl";
 className?: string;
 showTagline?: boolean;
}
/** Exact crops of the supplied ASCEND brand sheet. */
export function AscendLogo({variant="horizontal",size="md",className="",showTagline=true}:AscendLogoProps) {
 const icon=variant==="icon";
 const width=icon?{sm:30,md:42,lg:64,xl:220}[size]:{sm:140,md:184,lg:240,xl:320}[size];
 return <span className={"ascend-logo "+(icon?"ascend-logo-icon ":"ascend-logo-horizontal ")+className} style={{display:"inline-flex",width,maxWidth:"100%",flexShrink:0,verticalAlign:"middle"}}><Image src={icon?"/brand/logo-icon.png":"/brand/logo-horizontal.png"} alt={icon||!showTagline?"ASCEND":"ASCEND — BOOST YOUR POTENTIAL"} width={icon?395:536} height={icon?390:174} unoptimized style={{width:"100%",height:"auto",objectFit:"contain",mixBlendMode:"screen"}} /></span>;
}
