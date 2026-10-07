import { chromium, expect } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
const base=process.env.REVIEW_URL||"http://127.0.0.1:3108";
const browser=await chromium.launch({channel:"msedge",headless:true});
const context=await browser.newContext();const page=await context.newPage();
const protocols=[],errors=[];page.on("pageerror",e=>errors.push(e.message));
const cdp=await context.newCDPSession(page);await cdp.send("Page.enable");
cdp.on("Page.frameRequestedNavigation",e=>{if(e.url.startsWith("ascendriot:"))protocols.push(e.url);});
try {
 await page.goto(base+"/admin/login");
 await page.getByRole("button",{name:"Nhân sự / Employee",exact:true}).click();
 await page.getByRole("button",{name:"Đăng nhập",exact:true}).click();
 await expect(page).toHaveURL(base+"/employee");
 await page.goto(base+"/employee/orders/available");
 await page.locator("article").filter({hasText:"#ASC-1054"}).getByRole("button",{name:"NHẬN ĐƠN",exact:true}).click();
 await page.getByRole("button",{name:"Xác nhận nhận đơn",exact:true}).click();
 await expect(page).toHaveURL(base+"/employee/orders/ASC-1054");
 expect(protocols).toHaveLength(0); // No launch during load/login/claim.
 const launch=page.getByRole("link",{name:"MỞ RIOT CLIENT",exact:true});
 await expect(launch).toHaveAttribute("href","ascendriot://open/league");
 await page.getByRole("button",{name:"Hướng dẫn thiết lập",exact:true}).click();
 const dialog=page.getByRole("dialog");await expect(dialog).toContainText("Không cần source code");
 await expect(dialog.getByRole("link",{name:"TEST LAUNCHER",exact:true})).toHaveAttribute("href","ascendriot://test");
 const url=await dialog.getByRole("link",{name:"TẢI ASCEND LAUNCHER",exact:true}).getAttribute("href");
 const response=await page.request.get(new URL(url,base).href);expect(response.status()).toBe(200);
 const bytes=await response.body();const packaged=await readFile(new URL("../tools/ascend-launcher/dist/AscendLauncher_0.1.0_x64-setup.exe",import.meta.url));
 expect(createHash("sha256").update(bytes).digest("hex")).toBe(createHash("sha256").update(packaged).digest("hex"));
 await page.keyboard.press("Escape");
 for(const width of [390,1440]) {
  await page.setViewportSize({width,height:844});
  await page.getByRole("button",{name:"Hướng dẫn thiết lập",exact:true}).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(await page.getByRole("dialog").evaluate(d=>{const r=d.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1;})).toBe(true);
  await page.keyboard.press("Escape");
 }
 const persisted=await context.storageState();
 await launch.click();await expect(page.getByText("ASCEND Launcher không mở?",{exact:false})).toBeVisible();
 await expect(page.getByRole("link",{name:"THỬ LẠI",exact:true})).toHaveAttribute("href","ascendriot://open/league");
 await expect.poll(()=>protocols.includes("ascendriot://open/league")).toBe(true);
 // A native external-app confirmation can block subsequent DOM clicks in headless Edge.
 // Do not accept or bypass it. Review each protocol as the final click in its own browser.
 await browser.close();
 const testBrowser=await chromium.launch({channel:"msedge",headless:true});
 try {
  const testContext=await testBrowser.newContext({storageState:persisted});const testPage=await testContext.newPage();
  testPage.on("pageerror",e=>errors.push(e.message));const testCdp=await testContext.newCDPSession(testPage);await testCdp.send("Page.enable");
  testCdp.on("Page.frameRequestedNavigation",e=>{if(e.url.startsWith("ascendriot:"))protocols.push(e.url);});
  await testPage.goto(base+"/admin/login");await testPage.getByRole("button",{name:"Nhân sự / Employee",exact:true}).click();
  await testPage.getByRole("button",{name:"Đăng nhập",exact:true}).click();await expect(testPage).toHaveURL(base+"/employee");
  await testPage.goto(base+"/employee/orders/ASC-1054");await expect(testPage.getByRole("link",{name:"MỞ RIOT CLIENT",exact:true})).toBeVisible();
  await testPage.getByRole("button",{name:"Hướng dẫn thiết lập",exact:true}).click();
  await testPage.getByRole("dialog").getByRole("link",{name:"TEST LAUNCHER",exact:true}).click();
  await expect.poll(()=>protocols.some(p=>/^ascendriot:\/\/test\/?$/.test(p))).toBe(true);
 }finally{await testBrowser.close();} expect(errors).toHaveLength(0);
 console.log(JSON.stringify({result:"PASS",automaticLaunch:"none",navigation:"plain user-click anchors",helper:"visible without claiming installed status; mobile/desktop dialog fits",retry:"native href verified; app opening requires user confirmation",selfTestRequest:"PASS in independent browser",download:{status:response.status(),bytes:bytes.length,hashMatchesSetup:true},protocols,pageErrors:errors},null,2));
}finally{await browser.close();}
