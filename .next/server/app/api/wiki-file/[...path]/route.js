"use strict";(()=>{var e={};e.id=491,e.ids=[491],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},7904:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>g,patchFetch:()=>x,requestAsyncStorage:()=>u,routeModule:()=>d,serverHooks:()=>m,staticGenerationAsyncStorage:()=>h});var i={};r.r(i),r.d(i,{GET:()=>c});var o=r(9303),a=r(8716),n=r(670),s=r(7070),p=r(2048),l=r(5315);async function c(e,{params:t}){try{let e=l.join(process.cwd(),"wiki",...t.path),r=l.join(process.cwd(),"wiki");if(!e.startsWith(r))return new s.NextResponse("Access denied",{status:403});if(!p.existsSync(e))return new s.NextResponse("File not found",{status:404});let i=p.readFileSync(e),o=l.basename(e);if(e.endsWith(".md")){let e=i.toString("utf-8"),t=`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${o}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      line-height: 1.6;
      color: #333;
    }
    h1 { color: #1a56db; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
    h2 { color: #374151; margin-top: 2rem; }
    h3 { color: #4b5563; }
    a { color: #1a56db; text-decoration: none; }
    a:hover { text-decoration: underline; }
    ul { padding-left: 1.5rem; }
    li { margin: 0.5rem 0; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0; }
    .back-link { display: inline-block; margin-bottom: 2rem; color: #6b7280; }
  </style>
</head>
<body>
  <a href="/issues" class="back-link">← Back to Issues</a>
  ${e.replace(/^# (.+)$/gm,"<h1>$1</h1>").replace(/^## (.+)$/gm,"<h2>$1</h2>").replace(/^### (.+)$/gm,"<h3>$1</h3>").replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/^\- \[ \] (.+)$/gm,'<li style="list-style: none;"><input type="checkbox" disabled> $1</li>').replace(/^\- (.+)$/gm,"<li>$1</li>").replace(/^---$/gm,"<hr>").replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2">$1</a>').replace(/\n\n/g,"</p><p>").replace(/^(?!<[hlu]|<hr|<a|<input|<p)(.+)$/gm,"<p>$1</p>")}
</body>
</html>`;return new s.NextResponse(t,{headers:{"Content-Type":"text/html"}})}return new s.NextResponse(i,{headers:{"Content-Type":"text/plain"}})}catch(e){return console.error("Error serving file:",e),new s.NextResponse("Error serving file",{status:500})}}let d=new o.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/wiki-file/[...path]/route",pathname:"/api/wiki-file/[...path]",filename:"route",bundlePath:"app/api/wiki-file/[...path]/route"},resolvedPagePath:"C:\\Users\\Buyer\\Documents\\CascadeProjects\\vance-county-minutes\\src\\app\\api\\wiki-file\\[...path]\\route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:u,staticGenerationAsyncStorage:h,serverHooks:m}=d,g="/api/wiki-file/[...path]/route";function x(){return(0,n.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:h})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),i=t.X(0,[276,972],()=>r(7904));module.exports=i})();