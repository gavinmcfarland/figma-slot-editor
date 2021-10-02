"use strict";var e;e={name:"svelte-app",private:!0,version:"1.0.0",scripts:{build:"rollup -c",dev:"rollup -c -w",start:"sirv public",validate:"svelte-check"},devDependencies:{"@figlets/helpers":"*","@figma/plugin-typings":"^1.19.2","@rollup/plugin-commonjs":"^17.0.0","@rollup/plugin-json":"^4.1.0","@rollup/plugin-node-resolve":"^11.0.0","@rollup/plugin-replace":"^3.0.0","@rollup/plugin-typescript":"^8.0.0","@tsconfig/svelte":"^1.0.0",autoprefixer:"^10.2.5",plugma:"*","postcss-logical":"^4.0.2",rollup:"^2.41.0","rollup-plugin-css-only":"^3.1.0","rollup-plugin-html-bundle":"0.0.3","rollup-plugin-livereload":"^2.0.0","rollup-plugin-node-polyfills":"^0.2.1","rollup-plugin-postcss":"^4.0.0","rollup-plugin-svelte":"^7.0.0","rollup-plugin-terser":"^7.0.0",svelte:"^3.0.0","svelte-check":"^1.2.3","svelte-preprocess":"^4.0.0",tslib:"^2.1.0",typescript:"^4.0.0"},dependencies:{postcss:"^8.2.7","rollup-plugin-typescript":"^1.0.1","sirv-cli":"^1.0.0"}};var t=function(t){var i={updateAvailable:!1,ui:{}};(null==e?void 0:e.version)&&(i.version=e.version);var o=[],n=[];i.on=(e,t)=>{o.push({type:e,callback:t})},i.command=(e,t)=>{n.push({type:e,callback:t})};var l=!1;i.setStartPage=e=>{i.ui.page=e,l=!0};var a=t(i);if(Object.assign({},i,{commands:a}),a)for(let[e,t]of Object.entries(a))figma.command===e&&(l||(i.ui.page=e),t(i),i.ui.open&&(console.log("open?"),figma.showUI(i.ui.html)));figma.ui.onmessage=e=>{for(let t of o)e.type===t.type&&t.callback(e)},i.ui.show=e=>{figma.showUI(i.ui.html,{width:i.ui.width,height:i.ui.height}),figma.ui.postMessage(e)};for(let e of n)figma.command===e.type&&e.callback(i)};const i=[];figma.ui.onmessage=e=>{for(let t of i)e.action===t.action&&t.callback(e.data)};const o=["id","parent","name","removed","visible","locked","children","constraints","absoluteTransform","relativeTransform","x","y","rotation","width","height","constrainProportions","layoutAlign","layoutGrow","opacity","blendMode","isMask","effects","effectStyleId","expanded","backgrounds","backgroundStyleId","fills","strokes","strokeWeight","strokeMiterLimit","strokeAlign","strokeCap","strokeJoin","dashPattern","fillStyleId","strokeStyleId","cornerRadius","cornerSmoothing","topLeftRadius","topRightRadius","bottomLeftRadius","bottomRightRadius","exportSettings","overflowDirection","numberOfFixedChildren","overlayPositionType","overlayBackground","overlayBackgroundInteraction","reactions","description","remote","key","layoutMode","primaryAxisSizingMode","counterAxisSizingMode","primaryAxisAlignItems","counterAxisAlignItems","paddingLeft","paddingRight","paddingTop","paddingBottom","itemSpacing","layoutGrids","gridStyleId","clipsContent","guides","type"],n=["id","parent","removed","children","absoluteTransform","width","height","overlayPositionType","overlayBackground","overlayBackgroundInteraction","reactions","remote","key","type","masterComponent","mainComponent"];var l=function e(t,i,...l){var a,r;i&&0===Object.keys(i).length&&i.constructor===Object&&(a=!0),l[0],l[1],"object"==typeof l[0]&&"function"!=typeof l[0]&&(r=l[0]),"object"==typeof l[0]&&"function"!=typeof l[0]&&(r=l[0]),r||(r={});const{include:s,exclude:d,withoutRelations:c,removeConflicts:u}=r;let p=o.filter((function(e){return!n.includes(e)}));s&&(p=s.filter((function(e){return!n.includes(e)}))),d&&(p=p.filter((function(e){return!d.concat(n).includes(e)}))),i&&!a&&(p=p.filter((function(e){return!["id","type"].includes(e)})));var g={};a&&(void 0===g.id&&(g.id=t.id),void 0===g.type&&(g.type=t.type),t.key&&(g.key=t.key));const m=Object.entries(Object.getOwnPropertyDescriptors(t.__proto__));for(const[e,i]of m)if(p.includes(e))try{"symbol"==typeof g[e]?g[e]="Mixed":g[e]=i.get.call(t)}catch(t){g[e]=void 0}return u||(!g.fillStyleId&&g.fills?delete g.fillStyleId:delete g.fills,!g.strokeStyleId&&g.strokes?delete g.strokeStyleId:delete g.strokes,!g.backgroundStyleId&&g.backgrounds?delete g.backgroundStyleId:delete g.backgrounds,!g.effectStyleId&&g.effects?delete g.effectStyleId:delete g.effects,!g.gridStyleId&&g.layoutGrids?delete g.gridStyleId:delete g.layoutGrids,g.textStyleId?(delete g.fontName,delete g.fontSize,delete g.letterSpacing,delete g.lineHeight,delete g.paragraphIndent,delete g.paragraphSpacing,delete g.textCase,delete g.textDecoration):delete g.textStyleId,g.cornerRadius!==figma.mixed?(delete g.topLeftRadius,delete g.topRightRadius,delete g.bottomLeftRadius,delete g.bottomRightRadius):delete g.cornerRadius),a&&t.parent&&!c&&(g.parent={id:t.parent.id,type:t.parent.type}),a&&("FRAME"!==t.type&&"COMPONENT"!==t.type&&"COMPONENT_SET"!==t.type&&"PAGE"!==t.type&&"GROUP"!==t.type&&"INSTANCE"!==t.type&&"DOCUMENT"!==t.type&&"BOOLEAN_OPERATION"!==t.type||t.children&&!c&&(g.children=t.children.map((t=>e(t,{},{withoutRelations:c})))),"INSTANCE"===t.type&&t.mainComponent&&!c&&(g.masterComponent=e(t.mainComponent,{},{withoutRelations:c}))),Object.assign(i,g),g},a=function(e,t,i){e.setPluginData(t,JSON.stringify(i))},r=!1,s=figma.currentPage.selection,d=[];function c(e){return Array.isArray(e)?e:[e]}function u(e,t){var i=e.getPluginData(t);if(i)return JSON.parse(i)}function p(e){var t=figma.getNodeById(e);return t?null===t.parent||null===t.parent.parent?(figma.currentPage.appendChild(t),t):t:null}const g=e=>e&&e.parent&&!(e=>"PAGE"===e.type)(e.parent)?g(e.parent):e;function m(e){const t=e.parent;return"INSTANCE"===t.type||"PAGE"!==t.type&&m(t)}function f(e){const t=e.parent;return"COMPONENT"===t.type||"PAGE"!==t.type&&f(t)}function y(e){var t;return"COMPONENT"===e.type?e:"PAGE"===e.type?null:"COMPONENT"===(null===(t=null==e?void 0:e.parent)||void 0===t?void 0:t.type)?e.parent:y(null==e?void 0:e.parent)}function v(e){return u(e,"isSlotParent")?e:"PAGE"===e.type?null:u(null==e?void 0:e.parent,"isSlotParent")?e.parent:v(null==e?void 0:e.parent)}const h=(e,t)=>(t=t||g(e),{x:Math.abs(Math.round(t.absoluteTransform[0][2]-e.absoluteTransform[0][2])),y:Math.abs(Math.round(t.absoluteTransform[1][2]-e.absoluteTransform[1][2]))});function S(e,t="make"){var i=e,o=e.parent;e.x,e.y;var n,r=function(e){return e.parent.children.indexOf(e)}(e);const s=figma.createComponent();if(s.setRelaunchData({editSlot:"Edit the selected slot",removeSlot:"Remove the selected slot"}),a(s,"isSlot",!0),s.resizeWithoutConstraints(e.width,e.height),"FRAME"===e.type||"INSTANCE"===e.type){l(e,s),"INSTANCE"===e.type&&(n=e.clone(),e=n.detachInstance());for(const t of e.children)s.appendChild(t);"edit"===t&&"INSTANCE"===i.type&&i.swapComponent(s)}else"TEXT"===e.type&&(s.layoutMode="VERTICAL","HEIGHT"===e.textAutoResize&&(s.primaryAxisSizingMode="AUTO"),"WIDTH_AND_HEIGHT"===e.textAutoResize&&(s.primaryAxisSizingMode="AUTO",s.counterAxisSizingMode="AUTO")),l(e,s,{include:["layoutAlign","layoutGrow","name","x","y"]}),s.appendChild(e);if("make"===t){var c=s.createInstance();l(e,c,{include:["layoutAlign","layoutGrow","constraints","x","y"]}),e.x=0,e.y=0,o.insertChild(r,c),"INSTANCE"===i.type&&i&&i.remove(),d.push(c)}return"FRAME"===e.type&&e.remove(),s.remove(),{component:s,origNode:i}}var A=0,N=0;function I(e){for(var t=0;t<e.length;t++){var i=e[t];u(i,"isSlot")&&(A+=1),i.children&&I(i.children)}return console.log(A),A}function P(e,t=!0){for(var i=c(e),o=0;o<i.length;o++){let e=i[o];var n;if(u(e,"isSlot")&&(N+=1,t=!1),"INSTANCE"===e.type)(n=(n=e.mainComponent.name.replace(/<slot>$/,"")).trim())!==e.mainComponent.name&&(e.mainComponent.name=n),e.name=e.name.replace(/<slot>$/,""),e.name=e.name.trim();var l=y(e);a(e,"isSlot",""),t&&e.children&&P(e.children),e.id!==(null==l?void 0:l.id)&&e.setRelaunchData({})}return N}var b=0;function k(e){for(var t=c(e),i=0;i<t.length;i++){let e=t[i];if(u(e,"isSlot")){b+=1;let t=e.opacity,i=e.layoutAlign,n=e.primaryAxisSizingMode,l=e.counterAxisSizingMode;e.layoutGrow,e.parent;let a=e.visible,{component:d}=S(e,"edit");function o(e){if(figma.getNodeById(e.id)&&figma.getNodeById(d.id)){var t=h(e);d.x=g(e).x+t.x,d.y=g(e).y+t.y}}d.visible=a,!1===r&&(figma.currentPage.selection=[],r=!0),figma.getNodeById(d.id)&&figma.currentPage.appendChild(d),o(e),setInterval((()=>{null===d.parent&&(e.visible=!1),o(e),figma.getNodeById(e.id)&&figma.getNodeById(d.id)&&(d.resize(e.width,e.height),d.layoutAlign=i,d.primaryAxisSizingMode=n,d.counterAxisSizingMode=l)}),100),figma.getNodeById(e.id)&&(e.opacity=0),figma.on("close",(()=>{figma.getNodeById(e.id)&&(e.opacity=t);let i=p(d.id);i&&null!==(null==i?void 0:i.parent)&&"COMPONENT"!==e.type&&i.remove(),figma.getNodeById(s[0].id)&&"COMPONENT"!==e.type&&(figma.currentPage.selection=s)}))}else e.children&&k(e.children)}return b}t((e=>{e.ui={html:__html__,width:268,height:504},e.command("makeSlot",(({ui:e,data:t})=>{var i=figma.currentPage.selection,o=0;if(I(i)>1)figma.closePlugin(`Already contains ${N} slots`);else if(1===N)figma.closePlugin(`Already contains ${N} slot`);else{for(var n=0;n<i.length;n++){var l=i[n],r=m(l);if(!0!==u(l,"isSlot"))if(!r&&f(l)){var s=y(l);s&&(a(s,"isSlotParent",!0),s.setRelaunchData({editSlot:"Edit slots on this instance",removeSlot:"Remove slots on this instance"}));var{component:c}=S(l);c.name=c.name+" <slot>",a(c,"isSlot",!0),s&&"INSTANCE"!==l.type&&c.remove(),o+=1}else r?figma.notify("Edit main component to make slot"):figma.notify("Slot must be inside a component");else figma.notify("Already a slot")}o>1?(figma.currentPage.selection=d,figma.notify(`${o} slots made`)):1===o&&(figma.currentPage.selection=d,figma.notify(`${o} slot made`))}figma.closePlugin()})),e.command("editSlot",(({ui:e,data:t})=>{var i=figma.currentPage.selection;if(i.length>0){const e=figma.notify("Editing slots...",{timeout:99999999999});var o=k(i);o>0&&figma.on("close",(()=>{e.cancel()})),0===o&&(e.cancel(),figma.closePlugin("No slots found"))}else 0===i.length&&figma.closePlugin("Please select a slot or instance with slots")})),e.command("removeSlot",(()=>{for(var e=P(figma.currentPage.selection),t=0;t<figma.currentPage.selection.length;t++){var i=figma.currentPage.selection[t],o=y(i)||v(i);if(o){I([o])<1&&o.setRelaunchData({})}}e>1?figma.closePlugin(`${e} slots removed`):1===e?figma.closePlugin(`${e} slot removed`):figma.closePlugin("No slots found"),figma.closePlugin()}))}));
