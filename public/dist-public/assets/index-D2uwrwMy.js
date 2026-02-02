(function(){const A=document.createElement("link").relList;if(A&&A.supports&&A.supports("modulepreload"))return;for(const K of document.querySelectorAll('link[rel="modulepreload"]'))F(K);new MutationObserver(K=>{for(const X of K)if(X.type==="childList")for(const H of X.addedNodes)H.tagName==="LINK"&&H.rel==="modulepreload"&&F(H)}).observe(document,{childList:!0,subtree:!0});function L(K){const X={};return K.integrity&&(X.integrity=K.integrity),K.referrerPolicy&&(X.referrerPolicy=K.referrerPolicy),K.crossOrigin==="use-credentials"?X.credentials="include":K.crossOrigin==="anonymous"?X.credentials="omit":X.credentials="same-origin",X}function F(K){if(K.ep)return;K.ep=!0;const X=L(K);fetch(K.href,X)}})();function $h(k){const A=atob(k),L=new Uint8Array(A.length);for(let F=0;F<A.length;F++)L[F]=A.charCodeAt(F);return new Int16Array(L.buffer,L.byteOffset,L.byteLength>>1)}var ft=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{},lc={},Ia={};Object.defineProperty(Ia,"__esModule",{value:!0});Ia.baseAssetPath=void 0;const xh=typeof window<"u"&&typeof window.document<"u",tc=xh?window.document.currentScript:null;let dc="/";tc&&(dc=tc.src.replace(/#.*$/,"").replace(/\?.*$/,"").replace(/\/[^/]+$/,"/"));Ia.baseAssetPath=dc;var Si={};Object.defineProperty(Si,"__esModule",{value:!0});Si.defaultModelFetcher=void 0;const Sh=k=>fetch(k).then(A=>A.arrayBuffer());Si.defaultModelFetcher=Sh;var er={},wr={};Object.defineProperty(wr,"__esModule",{value:!0});wr.log=void 0;const ms=k=>A=>{console.log(`VAD | ${k} >`,A)};wr.log={error:ms("error"),debug:ms("debug"),warn:ms("warn")};var ai={};Object.defineProperty(ai,"__esModule",{value:!0});ai.Message=void 0;var rc;(function(k){k.AudioFrame="AUDIO_FRAME",k.SpeechStart="SPEECH_START",k.VADMisfire="VAD_MISFIRE",k.SpeechEnd="SPEECH_END",k.SpeechStop="SPEECH_STOP",k.SpeechRealStart="SPEECH_REAL_START",k.FrameProcessed="FRAME_PROCESSED"})(rc||(ai.Message=rc={}));Object.defineProperty(er,"__esModule",{value:!0});er.FrameProcessor=er.validateOptions=er.defaultFrameProcessorOptions=void 0;const ba=wr,ri=ai;er.defaultFrameProcessorOptions={positiveSpeechThreshold:.3,negativeSpeechThreshold:.25,preSpeechPadMs:800,redemptionMs:1400,minSpeechMs:400,submitUserSpeechOnPause:!1};function Th(k){(k.positiveSpeechThreshold<0||k.positiveSpeechThreshold>1)&&ba.log.error("positiveSpeechThreshold should be a number between 0 and 1"),(k.negativeSpeechThreshold<0||k.negativeSpeechThreshold>k.positiveSpeechThreshold)&&ba.log.error("negativeSpeechThreshold should be between 0 and positiveSpeechThreshold"),k.preSpeechPadMs<0&&ba.log.error("preSpeechPadMs should be positive"),k.redemptionMs<0&&ba.log.error("redemptionMs should be positive"),k.minSpeechMs<0&&ba.log.error("minSpeechMs should be positive")}er.validateOptions=Th;const ic=k=>{const A=k.reduce((F,K)=>(F.push(F.at(-1)+K.length),F),[0]),L=new Float32Array(A.at(-1));return k.forEach((F,K)=>{const X=A[K];L.set(F,X)}),L};function ac(k,A){const L=Math.floor(k.redemptionMs/A),F=Math.floor(k.preSpeechPadMs/A),K=Math.floor(k.minSpeechMs/A);return{redemptionFrames:L,preSpeechPadFrames:F,minSpeechFrames:K}}class Eh{constructor(A,L,F,K){this.modelProcessFunc=A,this.modelResetFunc=L,this.options=F,this.msPerFrame=K,this.speaking=!1,this.redemptionCounter=0,this.speechFrameCount=0,this.active=!1,this.speechRealStartFired=!1,this.setOptions=C=>{this.options={...this.options,...C};const{redemptionFrames:ge,preSpeechPadFrames:je,minSpeechFrames:ze}=ac(this.options,this.msPerFrame);this.redemptionFrames=ge,this.preSpeechPadFrames=je,this.minSpeechFrames=ze},this.reset=()=>{this.speaking=!1,this.speechRealStartFired=!1,this.audioBuffer=[],this.modelResetFunc(),this.redemptionCounter=0,this.speechFrameCount=0},this.pause=C=>{this.active=!1,this.options.submitUserSpeechOnPause?this.endSegment(C):this.reset()},this.resume=()=>{this.active=!0},this.endSegment=C=>{const ge=this.audioBuffer;this.audioBuffer=[];const je=this.speaking;if(this.reset(),je)if(ge.reduce((Se,ve)=>ve.isSpeech?Se+1:Se,0)>=this.minSpeechFrames){const Se=ic(ge.map(ve=>ve.frame));C({msg:ri.Message.SpeechEnd,audio:Se})}else C({msg:ri.Message.VADMisfire});return{}},this.process=async(C,ge)=>{if(!this.active)return;const je=await this.modelProcessFunc(C),ze=je.isSpeech>=this.options.positiveSpeechThreshold;if(ge({probs:je,msg:ri.Message.FrameProcessed,frame:C}),this.audioBuffer.push({frame:C,isSpeech:ze}),ze&&(this.speechFrameCount++,this.redemptionCounter=0),ze&&!this.speaking&&(this.speaking=!0,ge({msg:ri.Message.SpeechStart})),this.speaking&&this.speechFrameCount===this.minSpeechFrames&&!this.speechRealStartFired&&(this.speechRealStartFired=!0,ge({msg:ri.Message.SpeechRealStart})),je.isSpeech<this.options.negativeSpeechThreshold&&this.speaking&&++this.redemptionCounter>=this.redemptionFrames){this.redemptionCounter=0,this.speechFrameCount=0,this.speaking=!1,this.speechRealStartFired=!1;const Se=this.audioBuffer;if(this.audioBuffer=[],Se.reduce((we,Ne)=>Ne.isSpeech?we+1:we,0)>=this.minSpeechFrames){const we=ic(Se.map(Ne=>Ne.frame));ge({msg:ri.Message.SpeechEnd,audio:we})}else ge({msg:ri.Message.VADMisfire})}if(!this.speaking){for(;this.audioBuffer.length>this.preSpeechPadFrames;)this.audioBuffer.shift();this.speechFrameCount=0}},this.audioBuffer=[];const{redemptionFrames:X,preSpeechPadFrames:H,minSpeechFrames:J}=ac(this.options,this.msPerFrame);this.redemptionFrames=X,this.preSpeechPadFrames=H,this.minSpeechFrames=J,this.reset()}}er.FrameProcessor=Eh;var pc={};function zt(k){throw new Error('Could not dynamically require "'+k+'". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.')}var cc={exports:{}};/*!
 * ONNX Runtime Web v1.23.2
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */(function(k,A){var L=(()=>{var F=Object.defineProperty,K=Object.getOwnPropertyDescriptor,X=Object.getOwnPropertyNames,H=Object.prototype.hasOwnProperty,J=(e=>typeof zt<"u"?zt:typeof Proxy<"u"?new Proxy(e,{get:(t,r)=>(typeof zt<"u"?zt:t)[r]}):e)(function(e){if(typeof zt<"u")return zt.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')}),C=(e,t)=>()=>(e&&(t=e(e=0)),t),ge=(e,t)=>{for(var r in t)F(e,r,{get:t[r],enumerable:!0})},je=(e,t,r,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let a of X(t))!H.call(e,a)&&a!==r&&F(e,a,{get:()=>t[a],enumerable:!(i=K(t,a))||i.enumerable});return e},ze=e=>je(F({},"__esModule",{value:!0}),e),Se,ve,we,Ne,Ke,wt=C(()=>{Se=new Map,ve=[],we=(e,t,r)=>{if(t&&typeof t.init=="function"&&typeof t.createInferenceSessionHandler=="function"){let i=Se.get(e);if(i===void 0)Se.set(e,{backend:t,priority:r});else{if(i.priority>r)return;if(i.priority===r&&i.backend!==t)throw new Error(`cannot register backend "${e}" using priority ${r}`)}if(r>=0){let a=ve.indexOf(e);a!==-1&&ve.splice(a,1);for(let n=0;n<ve.length;n++)if(Se.get(ve[n]).priority<=r){ve.splice(n,0,e);return}ve.push(e)}return}throw new TypeError("not a valid backend")},Ne=async e=>{let t=Se.get(e);if(!t)return"backend not found.";if(t.initialized)return t.backend;if(t.aborted)return t.error;{let r=!!t.initPromise;try{return r||(t.initPromise=t.backend.init(e)),await t.initPromise,t.initialized=!0,t.backend}catch(i){return r||(t.error=`${i}`,t.aborted=!0),t.error}finally{delete t.initPromise}}},Ke=async e=>{let t=e.executionProviders||[],r=t.map(u=>typeof u=="string"?u:u.name),i=r.length===0?ve:r,a,n=[],s=new Set;for(let u of i){let l=await Ne(u);typeof l=="string"?n.push({name:u,err:l}):(a||(a=l),a===l&&s.add(u))}if(!a)throw new Error(`no available backend found. ERR: ${n.map(u=>`[${u.name}] ${u.err}`).join(", ")}`);for(let{name:u,err:l}of n)r.includes(u)&&console.warn(`removing requested execution provider "${u}" from session options because it is not available: ${l}`);let o=t.filter(u=>s.has(typeof u=="string"?u:u.name));return[a,new Proxy(e,{get:(u,l)=>l==="executionProviders"?o:Reflect.get(u,l)})]}}),Rt=C(()=>{wt()}),Ie,ke=C(()=>{Ie="1.23.2"}),me,ce,Ve=C(()=>{ke(),me="warning",ce={wasm:{},webgl:{},webgpu:{},versions:{common:Ie},set logLevel(e){if(e!==void 0){if(typeof e!="string"||["verbose","info","warning","error","fatal"].indexOf(e)===-1)throw new Error(`Unsupported logging level: ${e}`);me=e}},get logLevel(){return me}},Object.defineProperty(ce,"logLevel",{enumerable:!0})}),re,ut=C(()=>{Ve(),re=ce}),He,mt,ur=C(()=>{He=(e,t)=>{let r=typeof document<"u"?document.createElement("canvas"):new OffscreenCanvas(1,1);r.width=e.dims[3],r.height=e.dims[2];let i=r.getContext("2d");if(i!=null){let a,n;(t==null?void 0:t.tensorLayout)!==void 0&&t.tensorLayout==="NHWC"?(a=e.dims[2],n=e.dims[3]):(a=e.dims[3],n=e.dims[2]);let s=(t==null?void 0:t.format)!==void 0?t.format:"RGB",o=t==null?void 0:t.norm,u,l;o===void 0||o.mean===void 0?u=[255,255,255,255]:typeof o.mean=="number"?u=[o.mean,o.mean,o.mean,o.mean]:(u=[o.mean[0],o.mean[1],o.mean[2],0],o.mean[3]!==void 0&&(u[3]=o.mean[3])),o===void 0||o.bias===void 0?l=[0,0,0,0]:typeof o.bias=="number"?l=[o.bias,o.bias,o.bias,o.bias]:(l=[o.bias[0],o.bias[1],o.bias[2],0],o.bias[3]!==void 0&&(l[3]=o.bias[3]));let d=n*a,p=0,h=d,f=d*2,m=-1;s==="RGBA"?(p=0,h=d,f=d*2,m=d*3):s==="RGB"?(p=0,h=d,f=d*2):s==="RBG"&&(p=0,f=d,h=d*2);for(let y=0;y<n;y++)for(let v=0;v<a;v++){let _=(e.data[p++]-l[0])*u[0],w=(e.data[h++]-l[1])*u[1],S=(e.data[f++]-l[2])*u[2],x=m===-1?255:(e.data[m++]-l[3])*u[3];i.fillStyle="rgba("+_+","+w+","+S+","+x+")",i.fillRect(v,y,1,1)}if("toDataURL"in r)return r.toDataURL();throw new Error("toDataURL is not supported")}else throw new Error("Can not access image data")},mt=(e,t)=>{let r=typeof document<"u"?document.createElement("canvas").getContext("2d"):new OffscreenCanvas(1,1).getContext("2d"),i;if(r!=null){let a,n,s;(t==null?void 0:t.tensorLayout)!==void 0&&t.tensorLayout==="NHWC"?(a=e.dims[2],n=e.dims[1],s=e.dims[3]):(a=e.dims[3],n=e.dims[2],s=e.dims[1]);let o=t!==void 0&&t.format!==void 0?t.format:"RGB",u=t==null?void 0:t.norm,l,d;u===void 0||u.mean===void 0?l=[255,255,255,255]:typeof u.mean=="number"?l=[u.mean,u.mean,u.mean,u.mean]:(l=[u.mean[0],u.mean[1],u.mean[2],255],u.mean[3]!==void 0&&(l[3]=u.mean[3])),u===void 0||u.bias===void 0?d=[0,0,0,0]:typeof u.bias=="number"?d=[u.bias,u.bias,u.bias,u.bias]:(d=[u.bias[0],u.bias[1],u.bias[2],0],u.bias[3]!==void 0&&(d[3]=u.bias[3]));let p=n*a;if(t!==void 0&&(t.format!==void 0&&s===4&&t.format!=="RGBA"||s===3&&t.format!=="RGB"&&t.format!=="BGR"))throw new Error("Tensor format doesn't match input tensor dims");let h=4,f=0,m=1,y=2,v=3,_=0,w=p,S=p*2,x=-1;o==="RGBA"?(_=0,w=p,S=p*2,x=p*3):o==="RGB"?(_=0,w=p,S=p*2):o==="RBG"&&(_=0,S=p,w=p*2),i=r.createImageData(a,n);for(let z=0;z<n*a;f+=h,m+=h,y+=h,v+=h,z++)i.data[f]=(e.data[_++]-d[0])*l[0],i.data[m]=(e.data[w++]-d[1])*l[1],i.data[y]=(e.data[S++]-d[2])*l[2],i.data[v]=x===-1?255:(e.data[x++]-d[3])*l[3]}else throw new Error("Can not access image data");return i}}),lt,_t,_r,br,Be,Ct,Ti=C(()=>{$r(),lt=(e,t)=>{if(e===void 0)throw new Error("Image buffer must be defined");if(t.height===void 0||t.width===void 0)throw new Error("Image height and width must be defined");if(t.tensorLayout==="NHWC")throw new Error("NHWC Tensor layout is not supported yet");let{height:r,width:i}=t,a=t.norm??{mean:255,bias:0},n,s;typeof a.mean=="number"?n=[a.mean,a.mean,a.mean,a.mean]:n=[a.mean[0],a.mean[1],a.mean[2],a.mean[3]??255],typeof a.bias=="number"?s=[a.bias,a.bias,a.bias,a.bias]:s=[a.bias[0],a.bias[1],a.bias[2],a.bias[3]??0];let o=t.format!==void 0?t.format:"RGBA",u=t.tensorFormat!==void 0&&t.tensorFormat!==void 0?t.tensorFormat:"RGB",l=r*i,d=u==="RGBA"?new Float32Array(l*4):new Float32Array(l*3),p=4,h=0,f=1,m=2,y=3,v=0,_=l,w=l*2,S=-1;o==="RGB"&&(p=3,h=0,f=1,m=2,y=-1),u==="RGBA"?S=l*3:u==="RBG"?(v=0,w=l,_=l*2):u==="BGR"&&(w=0,_=l,v=l*2);for(let x=0;x<l;x++,h+=p,m+=p,f+=p,y+=p)d[v++]=(e[h]+s[0])/n[0],d[_++]=(e[f]+s[1])/n[1],d[w++]=(e[m]+s[2])/n[2],S!==-1&&y!==-1&&(d[S++]=(e[y]+s[3])/n[3]);return u==="RGBA"?new De("float32",d,[1,4,r,i]):new De("float32",d,[1,3,r,i])},_t=async(e,t)=>{let r=typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement,i=typeof ImageData<"u"&&e instanceof ImageData,a=typeof ImageBitmap<"u"&&e instanceof ImageBitmap,n=typeof e=="string",s,o=t??{},u=()=>{if(typeof document<"u")return document.createElement("canvas");if(typeof OffscreenCanvas<"u")return new OffscreenCanvas(1,1);throw new Error("Canvas is not supported")},l=d=>typeof HTMLCanvasElement<"u"&&d instanceof HTMLCanvasElement||d instanceof OffscreenCanvas?d.getContext("2d"):null;if(r){let d=u();d.width=e.width,d.height=e.height;let p=l(d);if(p!=null){let h=e.height,f=e.width;if(t!==void 0&&t.resizedHeight!==void 0&&t.resizedWidth!==void 0&&(h=t.resizedHeight,f=t.resizedWidth),t!==void 0){if(o=t,t.tensorFormat!==void 0)throw new Error("Image input config format must be RGBA for HTMLImageElement");o.tensorFormat="RGBA",o.height=h,o.width=f}else o.tensorFormat="RGBA",o.height=h,o.width=f;p.drawImage(e,0,0),s=p.getImageData(0,0,f,h).data}else throw new Error("Can not access image data")}else if(i){let d,p;if(t!==void 0&&t.resizedWidth!==void 0&&t.resizedHeight!==void 0?(d=t.resizedHeight,p=t.resizedWidth):(d=e.height,p=e.width),t!==void 0&&(o=t),o.format="RGBA",o.height=d,o.width=p,t!==void 0){let h=u();h.width=p,h.height=d;let f=l(h);if(f!=null)f.putImageData(e,0,0),s=f.getImageData(0,0,p,d).data;else throw new Error("Can not access image data")}else s=e.data}else if(a){if(t===void 0)throw new Error("Please provide image config with format for Imagebitmap");let d=u();d.width=e.width,d.height=e.height;let p=l(d);if(p!=null){let h=e.height,f=e.width;return p.drawImage(e,0,0,f,h),s=p.getImageData(0,0,f,h).data,o.height=h,o.width=f,lt(s,o)}else throw new Error("Can not access image data")}else{if(n)return new Promise((d,p)=>{let h=u(),f=l(h);if(!e||!f)return p();let m=new Image;m.crossOrigin="Anonymous",m.src=e,m.onload=()=>{h.width=m.width,h.height=m.height,f.drawImage(m,0,0,h.width,h.height);let y=f.getImageData(0,0,h.width,h.height);o.height=h.height,o.width=h.width,d(lt(y.data,o))}});throw new Error("Input data provided is not supported - aborted tensor creation")}if(s!==void 0)return lt(s,o);throw new Error("Input data provided is not supported - aborted tensor creation")},_r=(e,t)=>{let{width:r,height:i,download:a,dispose:n}=t,s=[1,i,r,4];return new De({location:"texture",type:"float32",texture:e,dims:s,download:a,dispose:n})},br=(e,t)=>{let{dataType:r,dims:i,download:a,dispose:n}=t;return new De({location:"gpu-buffer",type:r??"float32",gpuBuffer:e,dims:i,download:a,dispose:n})},Be=(e,t)=>{let{dataType:r,dims:i,download:a,dispose:n}=t;return new De({location:"ml-tensor",type:r??"float32",mlTensor:e,dims:i,download:a,dispose:n})},Ct=(e,t,r)=>new De({location:"cpu-pinned",type:e,data:t,dims:r??[t.length]})}),rt,Bt,vr,Ei,en=C(()=>{rt=new Map([["float32",Float32Array],["uint8",Uint8Array],["int8",Int8Array],["uint16",Uint16Array],["int16",Int16Array],["int32",Int32Array],["bool",Uint8Array],["float64",Float64Array],["uint32",Uint32Array],["int4",Uint8Array],["uint4",Uint8Array]]),Bt=new Map([[Float32Array,"float32"],[Uint8Array,"uint8"],[Int8Array,"int8"],[Uint16Array,"uint16"],[Int16Array,"int16"],[Int32Array,"int32"],[Float64Array,"float64"],[Uint32Array,"uint32"]]),vr=!1,Ei=()=>{if(!vr){vr=!0;let e=typeof BigInt64Array<"u"&&BigInt64Array.from,t=typeof BigUint64Array<"u"&&BigUint64Array.from,r=globalThis.Float16Array,i=typeof r<"u"&&r.from;e&&(rt.set("int64",BigInt64Array),Bt.set(BigInt64Array,"int64")),t&&(rt.set("uint64",BigUint64Array),Bt.set(BigUint64Array,"uint64")),i?(rt.set("float16",r),Bt.set(r,"float16")):rt.set("float16",Uint16Array)}}}),Ii,ki,tn=C(()=>{$r(),Ii=e=>{let t=1;for(let r=0;r<e.length;r++){let i=e[r];if(typeof i!="number"||!Number.isSafeInteger(i))throw new TypeError(`dims[${r}] must be an integer, got: ${i}`);if(i<0)throw new RangeError(`dims[${r}] must be a non-negative integer, got: ${i}`);t*=i}return t},ki=(e,t)=>{switch(e.location){case"cpu":return new De(e.type,e.data,t);case"cpu-pinned":return new De({location:"cpu-pinned",data:e.data,type:e.type,dims:t});case"texture":return new De({location:"texture",texture:e.texture,type:e.type,dims:t});case"gpu-buffer":return new De({location:"gpu-buffer",gpuBuffer:e.gpuBuffer,type:e.type,dims:t});case"ml-tensor":return new De({location:"ml-tensor",mlTensor:e.mlTensor,type:e.type,dims:t});default:throw new Error(`tensorReshape: tensor location ${e.location} is not supported`)}}}),De,$r=C(()=>{ur(),Ti(),en(),tn(),De=class{constructor(e,t,r){Ei();let i,a;if(typeof e=="object"&&"location"in e)switch(this.dataLocation=e.location,i=e.type,a=e.dims,e.location){case"cpu-pinned":{let s=rt.get(i);if(!s)throw new TypeError(`unsupported type "${i}" to create tensor from pinned buffer`);if(!(e.data instanceof s))throw new TypeError(`buffer should be of type ${s.name}`);this.cpuData=e.data;break}case"texture":{if(i!=="float32")throw new TypeError(`unsupported type "${i}" to create tensor from texture`);this.gpuTextureData=e.texture,this.downloader=e.download,this.disposer=e.dispose;break}case"gpu-buffer":{if(i!=="float32"&&i!=="float16"&&i!=="int32"&&i!=="int64"&&i!=="uint32"&&i!=="uint8"&&i!=="bool"&&i!=="uint4"&&i!=="int4")throw new TypeError(`unsupported type "${i}" to create tensor from gpu buffer`);this.gpuBufferData=e.gpuBuffer,this.downloader=e.download,this.disposer=e.dispose;break}case"ml-tensor":{if(i!=="float32"&&i!=="float16"&&i!=="int32"&&i!=="int64"&&i!=="uint32"&&i!=="uint64"&&i!=="int8"&&i!=="uint8"&&i!=="bool"&&i!=="uint4"&&i!=="int4")throw new TypeError(`unsupported type "${i}" to create tensor from MLTensor`);this.mlTensorData=e.mlTensor,this.downloader=e.download,this.disposer=e.dispose;break}default:throw new Error(`Tensor constructor: unsupported location '${this.dataLocation}'`)}else{let s,o;if(typeof e=="string")if(i=e,o=r,e==="string"){if(!Array.isArray(t))throw new TypeError("A string tensor's data must be a string array.");s=t}else{let u=rt.get(e);if(u===void 0)throw new TypeError(`Unsupported tensor type: ${e}.`);if(Array.isArray(t)){if(e==="float16"&&u===Uint16Array||e==="uint4"||e==="int4")throw new TypeError(`Creating a ${e} tensor from number array is not supported. Please use ${u.name} as data.`);e==="uint64"||e==="int64"?s=u.from(t,BigInt):s=u.from(t)}else if(t instanceof u)s=t;else if(t instanceof Uint8ClampedArray)if(e==="uint8")s=Uint8Array.from(t);else throw new TypeError("A Uint8ClampedArray tensor's data must be type of uint8");else if(e==="float16"&&t instanceof Uint16Array&&u!==Uint16Array)s=new globalThis.Float16Array(t.buffer,t.byteOffset,t.length);else throw new TypeError(`A ${i} tensor's data must be type of ${u}`)}else if(o=t,Array.isArray(e)){if(e.length===0)throw new TypeError("Tensor type cannot be inferred from an empty array.");let u=typeof e[0];if(u==="string")i="string",s=e;else if(u==="boolean")i="bool",s=Uint8Array.from(e);else throw new TypeError(`Invalid element type of data array: ${u}.`)}else if(e instanceof Uint8ClampedArray)i="uint8",s=Uint8Array.from(e);else{let u=Bt.get(e.constructor);if(u===void 0)throw new TypeError(`Unsupported type for tensor data: ${e.constructor}.`);i=u,s=e}if(o===void 0)o=[s.length];else if(!Array.isArray(o))throw new TypeError("A tensor's dims must be a number array");a=o,this.cpuData=s,this.dataLocation="cpu"}let n=Ii(a);if(this.cpuData&&n!==this.cpuData.length&&!((i==="uint4"||i==="int4")&&Math.ceil(n/2)===this.cpuData.length))throw new Error(`Tensor's size(${n}) does not match data length(${this.cpuData.length}).`);this.type=i,this.dims=a,this.size=n}static async fromImage(e,t){return _t(e,t)}static fromTexture(e,t){return _r(e,t)}static fromGpuBuffer(e,t){return br(e,t)}static fromMLTensor(e,t){return Be(e,t)}static fromPinnedBuffer(e,t,r){return Ct(e,t,r)}toDataURL(e){return He(this,e)}toImageData(e){return mt(this,e)}get data(){if(this.ensureValid(),!this.cpuData)throw new Error("The data is not on CPU. Use `getData()` to download GPU data to CPU, or use `texture` or `gpuBuffer` property to access the GPU data directly.");return this.cpuData}get location(){return this.dataLocation}get texture(){if(this.ensureValid(),!this.gpuTextureData)throw new Error("The data is not stored as a WebGL texture.");return this.gpuTextureData}get gpuBuffer(){if(this.ensureValid(),!this.gpuBufferData)throw new Error("The data is not stored as a WebGPU buffer.");return this.gpuBufferData}get mlTensor(){if(this.ensureValid(),!this.mlTensorData)throw new Error("The data is not stored as a WebNN MLTensor.");return this.mlTensorData}async getData(e){switch(this.ensureValid(),this.dataLocation){case"cpu":case"cpu-pinned":return this.data;case"texture":case"gpu-buffer":case"ml-tensor":{if(!this.downloader)throw new Error("The current tensor is not created with a specified data downloader.");if(this.isDownloading)throw new Error("The current tensor is being downloaded.");try{this.isDownloading=!0;let t=await this.downloader();return this.downloader=void 0,this.dataLocation="cpu",this.cpuData=t,e&&this.disposer&&(this.disposer(),this.disposer=void 0),t}finally{this.isDownloading=!1}}default:throw new Error(`cannot get data from location: ${this.dataLocation}`)}}dispose(){if(this.isDownloading)throw new Error("The current tensor is being downloaded.");this.disposer&&(this.disposer(),this.disposer=void 0),this.cpuData=void 0,this.gpuTextureData=void 0,this.gpuBufferData=void 0,this.mlTensorData=void 0,this.downloader=void 0,this.isDownloading=void 0,this.dataLocation="none"}ensureValid(){if(this.dataLocation==="none")throw new Error("The tensor is disposed.")}reshape(e){if(this.ensureValid(),this.downloader||this.disposer)throw new Error("Cannot reshape a tensor that owns GPU resource.");return ki(this,e)}}}),qe,Ci=C(()=>{$r(),qe=De}),jt,xr,et,Ye,dt,pt,Ai=C(()=>{Ve(),jt=(e,t)=>{(typeof ce.trace>"u"?!ce.wasm.trace:!ce.trace)||console.timeStamp(`${e}::ORT::${t}`)},xr=(e,t)=>{var a;let r=((a=new Error().stack)==null?void 0:a.split(/\r\n|\r|\n/g))||[],i=!1;for(let n=0;n<r.length;n++){if(i&&!r[n].includes("TRACE_FUNC")){let s=`FUNC_${e}::${r[n].trim().split(" ")[1]}`;t&&(s+=`::${t}`),jt("CPU",s);return}r[n].includes("TRACE_FUNC")&&(i=!0)}},et=e=>{(typeof ce.trace>"u"?!ce.wasm.trace:!ce.trace)||xr("BEGIN",e)},Ye=e=>{(typeof ce.trace>"u"?!ce.wasm.trace:!ce.trace)||xr("END",e)},dt=e=>{(typeof ce.trace>"u"?!ce.wasm.trace:!ce.trace)||console.time(`ORT::${e}`)},pt=e=>{(typeof ce.trace>"u"?!ce.wasm.trace:!ce.trace)||console.timeEnd(`ORT::${e}`)}}),zi,rn=C(()=>{wt(),Ci(),Ai(),zi=class hc{constructor(t){this.handler=t}async run(t,r,i){et(),dt("InferenceSession.run");let a={},n={};if(typeof t!="object"||t===null||t instanceof qe||Array.isArray(t))throw new TypeError("'feeds' must be an object that use input names as keys and OnnxValue as corresponding values.");let s=!0;if(typeof r=="object"){if(r===null)throw new TypeError("Unexpected argument[1]: cannot be null.");if(r instanceof qe)throw new TypeError("'fetches' cannot be a Tensor");if(Array.isArray(r)){if(r.length===0)throw new TypeError("'fetches' cannot be an empty array.");s=!1;for(let l of r){if(typeof l!="string")throw new TypeError("'fetches' must be a string array or an object.");if(this.outputNames.indexOf(l)===-1)throw new RangeError(`'fetches' contains invalid output name: ${l}.`);a[l]=null}if(typeof i=="object"&&i!==null)n=i;else if(typeof i<"u")throw new TypeError("'options' must be an object.")}else{let l=!1,d=Object.getOwnPropertyNames(r);for(let p of this.outputNames)if(d.indexOf(p)!==-1){let h=r[p];(h===null||h instanceof qe)&&(l=!0,s=!1,a[p]=h)}if(l){if(typeof i=="object"&&i!==null)n=i;else if(typeof i<"u")throw new TypeError("'options' must be an object.")}else n=r}}else if(typeof r<"u")throw new TypeError("Unexpected argument[1]: must be 'fetches' or 'options'.");for(let l of this.inputNames)if(typeof t[l]>"u")throw new Error(`input '${l}' is missing in 'feeds'.`);if(s)for(let l of this.outputNames)a[l]=null;let o=await this.handler.run(t,a,n),u={};for(let l in o)if(Object.hasOwnProperty.call(o,l)){let d=o[l];d instanceof qe?u[l]=d:u[l]=new qe(d.type,d.data,d.dims)}return pt("InferenceSession.run"),Ye(),u}async release(){return this.handler.dispose()}static async create(t,r,i,a){et(),dt("InferenceSession.create");let n,s={};if(typeof t=="string"){if(n=t,typeof r=="object"&&r!==null)s=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof Uint8Array){if(n=t,typeof r=="object"&&r!==null)s=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof ArrayBuffer||typeof SharedArrayBuffer<"u"&&t instanceof SharedArrayBuffer){let d=t,p=0,h=t.byteLength;if(typeof r=="object"&&r!==null)s=r;else if(typeof r=="number"){if(p=r,!Number.isSafeInteger(p))throw new RangeError("'byteOffset' must be an integer.");if(p<0||p>=d.byteLength)throw new RangeError(`'byteOffset' is out of range [0, ${d.byteLength}).`);if(h=t.byteLength-p,typeof i=="number"){if(h=i,!Number.isSafeInteger(h))throw new RangeError("'byteLength' must be an integer.");if(h<=0||p+h>d.byteLength)throw new RangeError(`'byteLength' is out of range (0, ${d.byteLength-p}].`);if(typeof a=="object"&&a!==null)s=a;else if(typeof a<"u")throw new TypeError("'options' must be an object.")}else if(typeof i<"u")throw new TypeError("'byteLength' must be a number.")}else if(typeof r<"u")throw new TypeError("'options' must be an object.");n=new Uint8Array(d,p,h)}else throw new TypeError("Unexpected argument[0]: must be 'path' or 'buffer'.");let[o,u]=await Ke(s),l=await o.createInferenceSessionHandler(n,u);return pt("InferenceSession.create"),Ye(),new hc(l)}startProfiling(){this.handler.startProfiling()}endProfiling(){this.handler.endProfiling()}get inputNames(){return this.handler.inputNames}get outputNames(){return this.handler.outputNames}get inputMetadata(){return this.handler.inputMetadata}get outputMetadata(){return this.handler.outputMetadata}}}),Sr,an=C(()=>{rn(),Sr=zi}),nn=C(()=>{}),sn=C(()=>{}),on=C(()=>{}),un=C(()=>{}),Oi={};ge(Oi,{InferenceSession:()=>Sr,TRACE:()=>jt,TRACE_EVENT_BEGIN:()=>dt,TRACE_EVENT_END:()=>pt,TRACE_FUNC_BEGIN:()=>et,TRACE_FUNC_END:()=>Ye,Tensor:()=>qe,env:()=>re,registerBackend:()=>we});var Je=C(()=>{Rt(),ut(),an(),Ci(),nn(),sn(),Ai(),on(),un()}),Tr=C(()=>{}),Ri={};ge(Ri,{default:()=>Bi});var Er,Ir,Bi,ln=C(()=>{var e;Np(),bt(),Or(),Er="ort-wasm-proxy-worker",Ir=((e=globalThis.self)==null?void 0:e.name)===Er,Ir&&(self.onmessage=t=>{let{type:r,in:i}=t.data;try{switch(r){case"init-wasm":Mr(i.wasm).then(()=>{rs(i).then(()=>{postMessage({type:r})},a=>{postMessage({type:r,err:a})})},a=>{postMessage({type:r,err:a})});break;case"init-ep":{let{epName:a,env:n}=i;is(n,a).then(()=>{postMessage({type:r})},s=>{postMessage({type:r,err:s})});break}case"copy-from":{let{buffer:a}=i,n=qa(a);postMessage({type:r,out:n});break}case"create":{let{model:a,options:n}=i;ns(a,n).then(s=>{postMessage({type:r,out:s})},s=>{postMessage({type:r,err:s})});break}case"release":ss(i),postMessage({type:r});break;case"run":{let{sessionId:a,inputIndices:n,inputs:s,outputIndices:o,options:u}=i;us(a,n,s,o,new Array(o.length).fill(null),u).then(l=>{l.some(d=>d[3]!=="cpu")?postMessage({type:r,err:"Proxy does not support non-cpu tensor location."}):postMessage({type:r,out:l},ds([...s,...l]))},l=>{postMessage({type:r,err:l})});break}case"end-profiling":ls(i),postMessage({type:r});break;default:}}catch(a){postMessage({type:r,err:a})}}),Bi=Ir?null:t=>new Worker(t??Pe,{type:"classic",name:Er})}),Mi,Di,Pe,kr,tr,Pi,Ui,Cr,Ni,Ar,Li,zr,Vi,Or=C(()=>{Tr(),Mi=typeof location>"u"?void 0:location.origin,Di=()=>{var e,t;return typeof document<"u"?(e=document.currentScript)==null?void 0:e.src:typeof self<"u"?(t=self.location)==null?void 0:t.href:void 0},Pe=Di(),kr=()=>{if(Pe&&!Pe.startsWith("blob:"))return Pe.substring(0,Pe.lastIndexOf("/")+1)},tr=(e,t)=>{try{let r=t??Pe;return(r?new URL(e,r):new URL(e)).origin===Mi}catch{return!1}},Pi=(e,t)=>{let r=t??Pe;try{return(r?new URL(e,r):new URL(e)).href}catch{return}},Ui=(e,t)=>`${t??"./"}${e}`,Cr=async e=>{let t=await(await fetch(e,{credentials:"same-origin"})).blob();return URL.createObjectURL(t)},Ni=async e=>(await import(e)).default,Ar=(ln(),ze(Ri)).default,Li=async()=>{if(!Pe)throw new Error("Failed to load proxy worker: cannot determine the script source URL.");if(tr(Pe))return[void 0,Ar()];let e=await Cr(Pe);return[e,Ar(e)]},zr=void 0,Vi=async(e,t,r,i)=>{let a=zr&&!(e||t);if(a)if(Pe)a=tr(Pe);else if(i&&!r)a=!0;else throw new Error("cannot determine the script source URL.");if(a)return[void 0,zr];{let n="ort-wasm-simd-threaded.jsep.mjs",s=e??Pi(n,t),o=r&&s&&!tr(s,t),u=o?await Cr(s):s??Ui(n,t);return[o?u:void 0,await Ni(u)]}}}),Rr,rr,Mt,Br,Wi,Fi,qi,Mr,he,bt=C(()=>{Or(),rr=!1,Mt=!1,Br=!1,Wi=()=>{if(typeof SharedArrayBuffer>"u")return!1;try{return typeof MessageChannel<"u"&&new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)),WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,5,4,1,3,1,1,10,11,1,9,0,65,0,254,16,2,0,26,11]))}catch{return!1}},Fi=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,10,30,1,28,0,65,0,253,15,253,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,253,186,1,26,11]))}catch{return!1}},qi=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,19,1,17,0,65,1,253,15,65,2,253,15,65,3,253,15,253,147,2,11]))}catch{return!1}},Mr=async e=>{if(rr)return Promise.resolve();if(Mt)throw new Error("multiple calls to 'initializeWebAssembly()' detected.");if(Br)throw new Error("previous call to 'initializeWebAssembly()' failed.");Mt=!0;let t=e.initTimeout,r=e.numThreads;if(e.simd!==!1){if(e.simd==="relaxed"){if(!qi())throw new Error("Relaxed WebAssembly SIMD is not supported in the current environment.")}else if(!Fi())throw new Error("WebAssembly SIMD is not supported in the current environment.")}let i=Wi();r>1&&!i&&(typeof self<"u"&&!self.crossOriginIsolated&&console.warn("env.wasm.numThreads is set to "+r+", but this will not work unless you enable crossOriginIsolated mode. See https://web.dev/cross-origin-isolation-guide/ for more info."),console.warn("WebAssembly multi-threading is not supported in the current environment. Falling back to single-threading."),e.numThreads=r=1);let a=e.wasmPaths,n=typeof a=="string"?a:void 0,s=a==null?void 0:a.mjs,o=(s==null?void 0:s.href)??s,u=a==null?void 0:a.wasm,l=(u==null?void 0:u.href)??u,d=e.wasmBinary,[p,h]=await Vi(o,n,r>1,!!d||!!l),f=!1,m=[];if(t>0&&m.push(new Promise(y=>{setTimeout(()=>{f=!0,y()},t)})),m.push(new Promise((y,v)=>{let _={numThreads:r};if(d)_.wasmBinary=d;else if(l||n)_.locateFile=w=>l??n+w;else if(o&&o.indexOf("blob:")!==0)_.locateFile=w=>new URL(w,o).href;else if(p){let w=kr();w&&(_.locateFile=S=>w+S)}h(_).then(w=>{Mt=!1,rr=!0,Rr=w,y(),p&&URL.revokeObjectURL(p)},w=>{Mt=!1,Br=!0,v(w)})})),await Promise.race(m),f)throw new Error(`WebAssembly backend initializing failed due to timeout: ${t}ms`)},he=()=>{if(rr&&Rr)return Rr;throw new Error("WebAssembly is not initialized yet.")}}),Ge,ir,le,Dr=C(()=>{bt(),Ge=(e,t)=>{let r=he(),i=r.lengthBytesUTF8(e)+1,a=r._malloc(i);return r.stringToUTF8(e,a,i),t.push(a),a},ir=(e,t,r,i)=>{if(typeof e=="object"&&e!==null){if(r.has(e))throw new Error("Circular reference in options");r.add(e)}Object.entries(e).forEach(([a,n])=>{let s=t?t+a:a;if(typeof n=="object")ir(n,s+".",r,i);else if(typeof n=="string"||typeof n=="number")i(s,n.toString());else if(typeof n=="boolean")i(s,n?"1":"0");else throw new Error(`Can't handle extra config type: ${typeof n}`)})},le=e=>{let t=he(),r=t.stackSave();try{let i=t.PTR_SIZE,a=t.stackAlloc(2*i);t._OrtGetLastError(a,a+i);let n=Number(t.getValue(a,i===4?"i32":"i64")),s=t.getValue(a+i,"*"),o=s?t.UTF8ToString(s):"";throw new Error(`${e} ERROR_CODE: ${n}, ERROR_MESSAGE: ${o}`)}finally{t.stackRestore(r)}}}),Gi,dn=C(()=>{bt(),Dr(),Gi=e=>{let t=he(),r=0,i=[],a=e||{};try{if((e==null?void 0:e.logSeverityLevel)===void 0)a.logSeverityLevel=2;else if(typeof e.logSeverityLevel!="number"||!Number.isInteger(e.logSeverityLevel)||e.logSeverityLevel<0||e.logSeverityLevel>4)throw new Error(`log severity level is not valid: ${e.logSeverityLevel}`);if((e==null?void 0:e.logVerbosityLevel)===void 0)a.logVerbosityLevel=0;else if(typeof e.logVerbosityLevel!="number"||!Number.isInteger(e.logVerbosityLevel))throw new Error(`log verbosity level is not valid: ${e.logVerbosityLevel}`);(e==null?void 0:e.terminate)===void 0&&(a.terminate=!1);let n=0;return(e==null?void 0:e.tag)!==void 0&&(n=Ge(e.tag,i)),r=t._OrtCreateRunOptions(a.logSeverityLevel,a.logVerbosityLevel,!!a.terminate,n),r===0&&le("Can't create run options."),(e==null?void 0:e.extra)!==void 0&&ir(e.extra,"",new WeakSet,(s,o)=>{let u=Ge(s,i),l=Ge(o,i);t._OrtAddRunConfigEntry(r,u,l)!==0&&le(`Can't set a run config entry: ${s} - ${o}.`)}),[r,i]}catch(n){throw r!==0&&t._OrtReleaseRunOptions(r),i.forEach(s=>t._free(s)),n}}}),Hi,ji,Ki,Dt,Zi,Qi,pn=C(()=>{bt(),Dr(),Hi=e=>{switch(e){case"disabled":return 0;case"basic":return 1;case"extended":return 2;case"layout":return 3;case"all":return 99;default:throw new Error(`unsupported graph optimization level: ${e}`)}},ji=e=>{switch(e){case"sequential":return 0;case"parallel":return 1;default:throw new Error(`unsupported execution mode: ${e}`)}},Ki=e=>{e.extra||(e.extra={}),e.extra.session||(e.extra.session={});let t=e.extra.session;t.use_ort_model_bytes_directly||(t.use_ort_model_bytes_directly="1"),e.executionProviders&&e.executionProviders.some(r=>(typeof r=="string"?r:r.name)==="webgpu")&&(e.enableMemPattern=!1)},Dt=(e,t,r,i)=>{let a=Ge(t,i),n=Ge(r,i);he()._OrtAddSessionConfigEntry(e,a,n)!==0&&le(`Can't set a session config entry: ${t} - ${r}.`)},Zi=async(e,t,r)=>{for(let i of t){let a=typeof i=="string"?i:i.name,n=[];switch(a){case"webnn":if(a="WEBNN",typeof i!="string"){let d=i==null?void 0:i.deviceType;d&&Dt(e,"deviceType",d,r)}break;case"webgpu":if(a="JS",typeof i!="string"){let d=i;if(d!=null&&d.preferredLayout){if(d.preferredLayout!=="NCHW"&&d.preferredLayout!=="NHWC")throw new Error(`preferredLayout must be either 'NCHW' or 'NHWC': ${d.preferredLayout}`);Dt(e,"preferredLayout",d.preferredLayout,r)}}break;case"wasm":case"cpu":continue;default:throw new Error(`not supported execution provider: ${a}`)}let s=Ge(a,r),o=n.length,u=0,l=0;if(o>0){u=he()._malloc(o*he().PTR_SIZE),r.push(u),l=he()._malloc(o*he().PTR_SIZE),r.push(l);for(let d=0;d<o;d++)he().setValue(u+d*he().PTR_SIZE,n[d][0],"*"),he().setValue(l+d*he().PTR_SIZE,n[d][1],"*")}await he()._OrtAppendExecutionProvider(e,s,u,l,o)!==0&&le(`Can't append execution provider: ${a}.`)}},Qi=async e=>{let t=he(),r=0,i=[],a=e||{};Ki(a);try{let n=Hi(a.graphOptimizationLevel??"all"),s=ji(a.executionMode??"sequential"),o=typeof a.logId=="string"?Ge(a.logId,i):0,u=a.logSeverityLevel??2;if(!Number.isInteger(u)||u<0||u>4)throw new Error(`log severity level is not valid: ${u}`);let l=a.logVerbosityLevel??0;if(!Number.isInteger(l)||l<0||l>4)throw new Error(`log verbosity level is not valid: ${l}`);let d=typeof a.optimizedModelFilePath=="string"?Ge(a.optimizedModelFilePath,i):0;if(r=t._OrtCreateSessionOptions(n,!!a.enableCpuMemArena,!!a.enableMemPattern,s,!!a.enableProfiling,0,o,u,l,d),r===0&&le("Can't create session options."),a.executionProviders&&await Zi(r,a.executionProviders,i),a.enableGraphCapture!==void 0){if(typeof a.enableGraphCapture!="boolean")throw new Error(`enableGraphCapture must be a boolean value: ${a.enableGraphCapture}`);Dt(r,"enableGraphCapture",a.enableGraphCapture.toString(),i)}if(a.freeDimensionOverrides)for(let[p,h]of Object.entries(a.freeDimensionOverrides)){if(typeof p!="string")throw new Error(`free dimension override name must be a string: ${p}`);if(typeof h!="number"||!Number.isInteger(h)||h<0)throw new Error(`free dimension override value must be a non-negative integer: ${h}`);let f=Ge(p,i);t._OrtAddFreeDimensionOverride(r,f,h)!==0&&le(`Can't set a free dimension override: ${p} - ${h}.`)}return a.extra!==void 0&&ir(a.extra,"",new WeakSet,(p,h)=>{Dt(r,p,h,i)}),[r,i]}catch(n){throw r!==0&&t._OrtReleaseSessionOptions(r)!==0&&le("Can't release session options."),i.forEach(s=>t._free(s)),n}}}),vt,$t,xt,Pr,Ur,Nr,Lr,ni,pe=C(()=>{vt=e=>{switch(e){case"int8":return 3;case"uint8":return 2;case"bool":return 9;case"int16":return 5;case"uint16":return 4;case"int32":return 6;case"uint32":return 12;case"float16":return 10;case"float32":return 1;case"float64":return 11;case"string":return 8;case"int64":return 7;case"uint64":return 13;case"int4":return 22;case"uint4":return 21;default:throw new Error(`unsupported data type: ${e}`)}},$t=e=>{switch(e){case 3:return"int8";case 2:return"uint8";case 9:return"bool";case 5:return"int16";case 4:return"uint16";case 6:return"int32";case 12:return"uint32";case 10:return"float16";case 1:return"float32";case 11:return"float64";case 8:return"string";case 7:return"int64";case 13:return"uint64";case 22:return"int4";case 21:return"uint4";default:throw new Error(`unsupported data type: ${e}`)}},xt=(e,t)=>{let r=[-1,4,1,1,2,2,4,8,-1,1,2,8,4,8,-1,-1,-1,-1,-1,-1,-1,.5,.5][e],i=typeof t=="number"?t:t.reduce((a,n)=>a*n,1);return r>0?Math.ceil(i*r):void 0},Pr=e=>{switch(e){case"float16":return typeof Float16Array<"u"&&Float16Array.from?Float16Array:Uint16Array;case"float32":return Float32Array;case"uint8":return Uint8Array;case"int8":return Int8Array;case"uint16":return Uint16Array;case"int16":return Int16Array;case"int32":return Int32Array;case"bool":return Uint8Array;case"float64":return Float64Array;case"uint32":return Uint32Array;case"int64":return BigInt64Array;case"uint64":return BigUint64Array;default:throw new Error(`unsupported type: ${e}`)}},Ur=e=>{switch(e){case"verbose":return 0;case"info":return 1;case"warning":return 2;case"error":return 3;case"fatal":return 4;default:throw new Error(`unsupported logging level: ${e}`)}},Nr=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",Lr=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint64"||e==="int8"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",ni=e=>{switch(e){case"none":return 0;case"cpu":return 1;case"cpu-pinned":return 2;case"texture":return 3;case"gpu-buffer":return 4;case"ml-tensor":return 5;default:throw new Error(`unsupported data location: ${e}`)}}}),Vr,Xi=C(()=>{Tr(),Vr=async e=>{if(typeof e=="string"){let t=await fetch(e);if(!t.ok)throw new Error(`failed to load external data file: ${e}`);let r=t.headers.get("Content-Length"),i=r?parseInt(r,10):0;if(i<1073741824)return new Uint8Array(await t.arrayBuffer());{if(!t.body)throw new Error(`failed to load external data file: ${e}, no response body.`);let a=t.body.getReader(),n;try{n=new ArrayBuffer(i)}catch(o){if(o instanceof RangeError){let u=Math.ceil(i/65536);n=new WebAssembly.Memory({initial:u,maximum:u}).buffer}else throw o}let s=0;for(;;){let{done:o,value:u}=await a.read();if(o)break;let l=u.byteLength;new Uint8Array(n,s,l).set(u),s+=l}return new Uint8Array(n,0,i)}}else return e instanceof Blob?new Uint8Array(await e.arrayBuffer()):e instanceof Uint8Array?e:new Uint8Array(e)}}),Yi,si,oi,Kt,ui,li,Te,Et=C(()=>{pe(),Yi=["V","I","W","E","F"],si=(e,t)=>{console.log(`[${Yi[e]},${new Date().toISOString()}]${t}`)},ui=(e,t)=>{oi=e,Kt=t},li=(e,t)=>{let r=Ur(e),i=Ur(oi);r>=i&&si(r,typeof t=="function"?t():t)},Te=(...e)=>{Kt&&li(...e)}}),di,Zt,U,lr,pi,Ji,Pt,ne=C(()=>{di=class{static calcMatMulShape(e,t){return e[1]!==t[0]?void 0:[e[0],t[1]]}},Zt=class{static calcShape(e,t,r=!1){let i=e.length,a=t.length;if(i===0)return t;if(a===0)return e;let n=Math.max(e.length,t.length),s=new Array(n);if(r){if(i<2||a<2)return;let o=di.calcMatMulShape([e[i-2],e[i-1]],[t[a-2],t[a-1]]);if(o===void 0)return;[s[n-2],s[n-1]]=o}for(let o=r?3:1;o<=n;o++){let u=i-o<0?1:e[i-o],l=a-o<0?1:t[a-o];if(u!==l&&u>1&&l>1)return;let d=Math.max(u,l);if(u&&l)s[n-o]=Math.max(u,l);else{if(d>1)return;s[n-o]=0}}return s}static isValidBroadcast(e,t){let r=e.length,i=t.length;if(r>i)return!1;for(let a=1;a<=r;a++)if(e[r-a]!==1&&e[r-a]!==t[i-a])return!1;return!0}},U=class Ka{static size(t){return Ka.getSizeFromDimensionRange(t,0,t.length)}static convertShape(t,r=4){let i=t.length;if(i===0)return[];let a=new Array(i),n=i-1;for(;n>=0;){if(t[n]%r===0){a[n]=t[n]/r;break}if(r%t[n]!==0)throw new Error("cannot convert shape");a[n]=1,r/=t[n],n--}for(n--;n>=0;n--)a[n]=t[n];return a}static sizeFromDimension(t,r){if(r<0||r>t.length)throw new Error(`invalid dimension of ${r} for sizeFromDimension as Tensor has ${t.length} dimensions.`);return Ka.getSizeFromDimensionRange(t,r,t.length)}static sizeToDimension(t,r){if(r<0||r>t.length)throw new Error(`invalid dimension of ${r} for sizeToDimension as Tensor has ${t.length} dimensions.`);return Ka.getSizeFromDimensionRange(t,0,r)}static getSizeFromDimensionRange(t,r,i){let a=1;for(let n=r;n<i;n++){if(t[n]<0)throw new Error("cannot get valid size from specified dimension range. Most likely the range contains negative values in them.");a*=Number(t[n])}return a}static computeStrides(t){let r=t.length;if(r===0)return[];if(r===1)return[1];let i=new Array(r);i[r-1]=1,i[r-2]=t[r-1];for(let a=r-3;a>=0;--a)i[a]=i[a+1]*t[a+1];return i}static normalizeAxis(t,r){if(t<-r&&t>=r)throw new Error("unsupported axis for this operation.");return t<0?t+r:t}static normalizeAxes(t,r){return t.map(i=>this.normalizeAxis(i,r??t.length))}static sortBasedOnPerm(t,r){return r?r.map(i=>t[i]):t.slice().reverse()}static padShape(t,r){let i=t.length;return t.map((a,n)=>a+r[n]+r[n+i])}static areEqual(t,r){return t.length!==r.length?!1:t.every((i,a)=>i===r[a])}},lr=class $a{static adjustPoolAttributes(t,r,i,a,n,s){if(!t&&i.length!==r.length-2)throw new Error("length of specified kernel shapes should be 2 less than length of input dimensions");if(t)for(let o=0;o<r.length-2;o++)o>=i.length?i.push(r[o+2]):i[o]=r[o+2];for(let o=0;o<i.length;o++)if(o<a.length){if(a[o]<0)throw new Error("strides should be greater than or equal to 1")}else a.push(1);for(let o=0;o<i.length;o++)if(o<n.length){if(n[o]<0)throw new Error("dilations should be greater than or equal to 1")}else n.push(1);for(let o=0;o<i.length*2;o++)if(o<s.length){if(s[o]<0)throw new Error("pad should be greater than or equal to 1")}else s.push(0);for(let o=0;o<i.length;o++){if(i[o]<=0)throw new Error("kernel shapes need to be greater than 0");if(s[o]>=i[o]||s[o+i.length]>=i[o])throw new Error("pads should be smaller than kernel")}}static adjustPadsBasedOnAutoPad(t,r,i,a,n,s,o){if(o){if(n.length!==2*(t.length-2))throw new Error("length of pads should be twice the length of data dimensions");if(r.length!==t.length-2)throw new Error("length of strides should be the length of data dimensions");if(a.length!==t.length-2)throw new Error("length of kernel shapes should be the length of data dimensions");for(let u=0;u<t.length-2;u++)$a.adjustPadAndReturnShape(t[u+(s?1:2)],r[u],i[u],a[u],n,u,u+t.length-2,o)}}static computePoolOutputShape(t,r,i,a,n,s,o){if(r.length<=0)throw new Error("input shape must be of size greater than 0");let u=[r[0],r[1]];return $a.computeShapeHelper(t,r,u,i,a,n,s,o),u}static computeConvOutputShape(t,r,i,a,n,s,o){if(t.length<=0||r.length<=0)throw new Error("invalid input tensor dims or invalid filter tensor dims");let u=[t[0],r[0]];return $a.computeShapeHelper(!1,t,u,i,a,n,s,o),u}static computeShapeHelper(t,r,i,a,n,s,o,u){if(t)for(let l=0;l<r.length-2;l++)i.push(1);else for(let l=0;l<r.length-2;l++)i.push($a.adjustPadAndReturnShape(r[l+2],a[l],n[l],s[l],o,l,l+r.length-2,u))}static adjustPadAndReturnShape(t,r,i,a,n,s,o,u){let l=i*(a-1)+1;if(u&&u!=="NOTSET")switch(u){case"VALID":return n[s]=0,n[o]=0,Math.floor((t-l)/r+1);case"SAME_LOWER":case"SAME_UPPER":if(i!==1)throw new Error("Dilation not supported for SAME_UPPER or SAME_LOWER");{let d=((t+r-1)/r-1)*r+a-t;return n[s]=Math.floor(u==="SAME_LOWER"?(d+1)/2:d/2),n[o]=d-n[s],Math.floor((t+d-a)/r+1)}default:throw new Error("Unsupported AutoPad type")}else return Math.floor((t+n[s]+n[o]-l)/r+1)}},pi=class{static getShapeOfGemmResult(e,t,r,i,a){if(e.length!==2||r.length!==2)throw new Error("shape need to be of size 2");let n,s,o;t?(n=e[1],s=e[0]):(n=e[0],s=e[1]);let u=-1;if(i?(o=r[0],u=1):(o=r[1],u=0),r[u]!==s)throw new Error("dimension mismatch");if(n<=0||o<=0||s<=0)throw new Error("invalid shape specified");if(a&&!Zt.isValidBroadcast(a,[n,o]))throw new Error("gemm: invalid bias shape for broadcast");return[n,o,s]}},Ji=-34028234663852886e22,Pt=34028234663852886e22}),Qt,dr=C(()=>{pe(),Qt=(e,t)=>new(Pr(t))(e)}),ar,pr,Wr,Fr,Ut,Xt,ci,hi,fi,ea,ta,Ca=C(()=>{pe(),Et(),ar=new Map([["float32",32],["float16",16],["int32",32],["uint32",32],["int64",64],["uint64",64],["int8",8],["uint8",8],["int4",4],["uint4",4]]),pr=(e,t)=>{if(t==="int32")return e;let r=ar.get(t);if(!r)throw new Error(`WebNN backend does not support data type: ${t}`);let i=r/8;if(e.byteLength%i!==0)throw new Error(`Invalid Uint8Array length - must be a multiple of ${i}.`);let a=e.byteLength/i,n=new(Pr(t))(e.buffer,e.byteOffset,a);switch(t){case"int64":case"uint64":{let s=new Int32Array(a);for(let o=0;o<a;o++){let u=n[o];if(u>2147483647n||u<-2147483648n)throw new Error("Can not convert int64 data to int32 - value out of range.");s[o]=Number(u)}return new Uint8Array(s.buffer)}case"int8":case"uint8":case"uint32":{if(t==="uint32"&&n.some(o=>o>2147483647))throw new Error("Can not convert uint32 data to int32 - value out of range.");let s=Int32Array.from(n,Number);return new Uint8Array(s.buffer)}default:throw new Error(`Unsupported data conversion from ${t} to 'int32'`)}},Wr=(e,t)=>{if(t==="int32")return e;if(e.byteLength%4!==0)throw new Error("Invalid Uint8Array length - must be a multiple of 4 (int32).");let r=e.byteLength/4,i=new Int32Array(e.buffer,e.byteOffset,r);switch(t){case"int64":{let a=BigInt64Array.from(i,BigInt);return new Uint8Array(a.buffer)}case"uint64":{if(i.some(n=>n<0))throw new Error("Can not convert int32 data to uin64 - negative value found.");let a=BigUint64Array.from(i,BigInt);return new Uint8Array(a.buffer)}case"int8":{if(i.some(n=>n<-128||n>127))throw new Error("Can not convert int32 data to int8 - value out of range.");let a=Int8Array.from(i,Number);return new Uint8Array(a.buffer)}case"uint8":{if(i.some(a=>a<0||a>255))throw new Error("Can not convert int32 data to uint8 - value out of range.");return Uint8Array.from(i,Number)}case"uint32":{if(i.some(n=>n<0))throw new Error("Can not convert int32 data to uint32 - negative value found.");let a=Uint32Array.from(i,Number);return new Uint8Array(a.buffer)}default:throw new Error(`Unsupported data conversion from 'int32' to ${t}`)}},Fr=1,Ut=()=>Fr++,Xt=new Map([["int8","int32"],["uint8","int32"],["uint32","int32"],["int64","int32"]]),ci=(e,t)=>{let r=ar.get(e);if(!r)throw new Error(`WebNN backend does not support data type: ${e}`);return t.length>0?Math.ceil(t.reduce((i,a)=>i*a)*r/8):0},hi=class{constructor(e){this.isDataConverted=!1;let{sessionId:t,context:r,tensor:i,dataType:a,shape:n,fallbackDataType:s}=e;this.sessionId=t,this.mlContext=r,this.mlTensor=i,this.dataType=a,this.tensorShape=n,this.fallbackDataType=s}get tensor(){return this.mlTensor}get type(){return this.dataType}get fallbackType(){return this.fallbackDataType}get shape(){return this.tensorShape}get byteLength(){return ci(this.dataType,this.tensorShape)}destroy(){Te("verbose",()=>"[WebNN] TensorWrapper.destroy"),this.mlTensor.destroy()}write(e){this.mlContext.writeTensor(this.mlTensor,e)}async read(e){if(this.fallbackDataType){let t=await this.mlContext.readTensor(this.mlTensor),r=Wr(new Uint8Array(t),this.dataType);if(e){(e instanceof ArrayBuffer?new Uint8Array(e):new Uint8Array(e.buffer,e.byteOffset,e.byteLength)).set(r);return}else return r.buffer}else return e?this.mlContext.readTensor(this.mlTensor,e):this.mlContext.readTensor(this.mlTensor)}canReuseTensor(e,t,r){return this.mlContext===e&&this.dataType===t&&this.tensorShape.length===r.length&&this.tensorShape.every((i,a)=>i===r[a])}setIsDataConverted(e){this.isDataConverted=e}},fi=class{constructor(e,t){this.tensorManager=e,this.wrapper=t}get tensorWrapper(){return this.wrapper}releaseTensor(){this.tensorWrapper&&(this.tensorManager.releaseTensor(this.tensorWrapper),this.wrapper=void 0)}async ensureTensor(e,t,r,i){let a=this.tensorManager.getMLContext(e),n;if(!a.opSupportLimits().input.dataTypes.includes(t)){if(n=Xt.get(t),!n||!a.opSupportLimits().input.dataTypes.includes(n))throw new Error(`WebNN backend does not support data type: ${t}`);Te("verbose",()=>`[WebNN] TensorIdTracker.ensureTensor: fallback dataType from ${t} to ${n}`)}if(this.wrapper){if(this.wrapper.canReuseTensor(a,t,r))return this.wrapper.tensor;if(i){if(this.wrapper.byteLength!==ci(t,r))throw new Error("Unable to copy data to tensor with different size.");this.activeUpload=new Uint8Array(await this.wrapper.read())}this.tensorManager.releaseTensor(this.wrapper)}let s=typeof MLTensorUsage>"u"?void 0:MLTensorUsage.READ|MLTensorUsage.WRITE;return this.wrapper=await this.tensorManager.getCachedTensor(e,t,r,s,!0,!0,n),i&&this.activeUpload&&(this.wrapper.write(this.activeUpload),this.activeUpload=void 0),this.wrapper.tensor}upload(e){let t=e;if(this.wrapper){if(this.wrapper.fallbackType)if(this.wrapper.fallbackType==="int32")t=pr(e,this.wrapper.type),this.wrapper.setIsDataConverted(!0);else throw new Error(`Unsupported fallback data type: ${this.wrapper.fallbackType}`);if(e.byteLength===this.wrapper.byteLength){this.wrapper.write(t);return}else Te("verbose",()=>"Data size does not match tensor size. Releasing tensor."),this.releaseTensor()}this.activeUpload?this.activeUpload.set(t):this.activeUpload=new Uint8Array(t)}async download(e){var t,r;if(this.activeUpload){let i=(t=this.wrapper)!=null&&t.isDataConverted?Wr(this.activeUpload,(r=this.wrapper)==null?void 0:r.type):this.activeUpload;if(e){e instanceof ArrayBuffer?new Uint8Array(e).set(i):new Uint8Array(e.buffer,e.byteOffset,e.byteLength).set(i);return}else return i.buffer}if(!this.wrapper)throw new Error("Tensor has not been created.");return e?this.wrapper.read(e):this.wrapper.read()}},ea=class{constructor(e){this.backend=e,this.tensorTrackersById=new Map,this.freeTensors=[],this.externalTensors=new Set}getMLContext(e){let t=this.backend.getMLContext(e);if(!t)throw new Error("MLContext not found for session.");return t}reserveTensorId(){let e=Ut();return this.tensorTrackersById.set(e,new fi(this)),e}releaseTensorId(e){let t=this.tensorTrackersById.get(e);t&&(this.tensorTrackersById.delete(e),t.tensorWrapper&&this.releaseTensor(t.tensorWrapper))}async ensureTensor(e,t,r,i,a){Te("verbose",()=>`[WebNN] TensorManager.ensureTensor {tensorId: ${t}, dataType: ${r}, shape: ${i}, copyOld: ${a}}`);let n=this.tensorTrackersById.get(t);if(!n)throw new Error("Tensor not found.");return n.ensureTensor(e,r,i,a)}upload(e,t){let r=this.tensorTrackersById.get(e);if(!r)throw new Error("Tensor not found.");r.upload(t)}async download(e,t){Te("verbose",()=>`[WebNN] TensorManager.download {tensorId: ${e}, dstBuffer: ${t==null?void 0:t.byteLength}}`);let r=this.tensorTrackersById.get(e);if(!r)throw new Error("Tensor not found.");return r.download(t)}releaseTensorsForSession(e){for(let t of this.freeTensors)t.sessionId===e&&t.destroy();this.freeTensors=this.freeTensors.filter(t=>t.sessionId!==e)}registerTensor(e,t,r,i){let a=this.getMLContext(e),n=Ut(),s=new hi({sessionId:e,context:a,tensor:t,dataType:r,shape:i});return this.tensorTrackersById.set(n,new fi(this,s)),this.externalTensors.add(s),n}async getCachedTensor(e,t,r,i,a,n,s){let o=this.getMLContext(e);for(let[l,d]of this.freeTensors.entries())if(d.canReuseTensor(o,t,r)){Te("verbose",()=>`[WebNN] Reusing tensor {dataType: ${t}, ${s?`fallbackDataType: ${s},`:""} shape: ${r}`);let p=this.freeTensors.splice(l,1)[0];return p.sessionId=e,p}Te("verbose",()=>`[WebNN] MLContext.createTensor {dataType: ${t}, ${s?`fallbackDataType: ${s},`:""} shape: ${r}}`);let u=await o.createTensor({dataType:s??t,shape:r,dimensions:r,usage:i,writable:a,readable:n});return new hi({sessionId:e,context:o,tensor:u,dataType:t,shape:r,fallbackDataType:s})}releaseTensor(e){this.externalTensors.has(e)&&this.externalTensors.delete(e),this.freeTensors.push(e)}},ta=(...e)=>new ea(...e)}),cr,ra,ia,aa=C(()=>{pe(),bt(),dr(),Ca(),Et(),cr=new Map([[1,"float32"],[10,"float16"],[6,"int32"],[12,"uint32"],[7,"int64"],[13,"uint64"],[22,"int4"],[21,"uint4"],[3,"int8"],[2,"uint8"],[9,"uint8"]]),ra=(e,t)=>{if(e===t)return!0;if(e===void 0||t===void 0)return!1;let r=Object.keys(e).sort(),i=Object.keys(t).sort();return r.length===i.length&&r.every((a,n)=>a===i[n]&&e[a]===t[a])},ia=class{constructor(e){this.tensorManager=ta(this),this.mlContextBySessionId=new Map,this.sessionIdsByMLContext=new Map,this.mlContextCache=[],this.sessionGraphInputs=new Map,this.sessionGraphOutputs=new Map,this.temporaryGraphInputs=[],this.temporaryGraphOutputs=[],this.temporarySessionTensorIds=new Map,ui(e.logLevel,!!e.debug)}get currentSessionId(){if(this.activeSessionId===void 0)throw new Error("No active session");return this.activeSessionId}onRunStart(e){Te("verbose",()=>`[WebNN] onRunStart {sessionId: ${e}}`),this.activeSessionId=e}onRunEnd(e){Te("verbose",()=>`[WebNN] onRunEnd {sessionId: ${e}}`);let t=this.temporarySessionTensorIds.get(e);if(t){for(let r of t)Te("verbose",()=>`[WebNN] releasing temporary tensor {tensorId: ${r}}`),this.tensorManager.releaseTensorId(r);this.temporarySessionTensorIds.delete(e),this.activeSessionId=void 0}}async createMLContext(e){if(e instanceof GPUDevice){let r=this.mlContextCache.findIndex(i=>i.gpuDevice===e);if(r!==-1)return this.mlContextCache[r].mlContext;{let i=await navigator.ml.createContext(e);return this.mlContextCache.push({gpuDevice:e,mlContext:i}),i}}else if(e===void 0){let r=this.mlContextCache.findIndex(i=>i.options===void 0&&i.gpuDevice===void 0);if(r!==-1)return this.mlContextCache[r].mlContext;{let i=await navigator.ml.createContext();return this.mlContextCache.push({mlContext:i}),i}}let t=this.mlContextCache.findIndex(r=>ra(r.options,e));if(t!==-1)return this.mlContextCache[t].mlContext;{let r=await navigator.ml.createContext(e);return this.mlContextCache.push({options:e,mlContext:r}),r}}registerMLContext(e,t){this.mlContextBySessionId.set(e,t);let r=this.sessionIdsByMLContext.get(t);r||(r=new Set,this.sessionIdsByMLContext.set(t,r)),r.add(e),this.temporaryGraphInputs.length>0&&(this.sessionGraphInputs.set(e,this.temporaryGraphInputs),this.temporaryGraphInputs=[]),this.temporaryGraphOutputs.length>0&&(this.sessionGraphOutputs.set(e,this.temporaryGraphOutputs),this.temporaryGraphOutputs=[])}onReleaseSession(e){this.sessionGraphInputs.delete(e),this.sessionGraphOutputs.delete(e);let t=this.mlContextBySessionId.get(e);if(!t)return;this.tensorManager.releaseTensorsForSession(e),this.mlContextBySessionId.delete(e);let r=this.sessionIdsByMLContext.get(t);if(r.delete(e),r.size===0){this.sessionIdsByMLContext.delete(t);let i=this.mlContextCache.findIndex(a=>a.mlContext===t);i!==-1&&this.mlContextCache.splice(i,1)}}getMLContext(e){return this.mlContextBySessionId.get(e)}reserveTensorId(){return this.tensorManager.reserveTensorId()}releaseTensorId(e){Te("verbose",()=>`[WebNN] releaseTensorId {tensorId: ${e}}`),this.tensorManager.releaseTensorId(e)}async ensureTensor(e,t,r,i,a){let n=cr.get(r);if(!n)throw new Error(`Unsupported ONNX data type: ${r}`);return this.tensorManager.ensureTensor(e??this.currentSessionId,t,n,i,a)}async createTemporaryTensor(e,t,r){Te("verbose",()=>`[WebNN] createTemporaryTensor {onnxDataType: ${t}, shape: ${r}}`);let i=cr.get(t);if(!i)throw new Error(`Unsupported ONNX data type: ${t}`);let a=this.tensorManager.reserveTensorId();await this.tensorManager.ensureTensor(e,a,i,r,!1);let n=this.temporarySessionTensorIds.get(e);return n?n.push(a):this.temporarySessionTensorIds.set(e,[a]),a}uploadTensor(e,t){if(!he().shouldTransferToMLTensor)throw new Error("Trying to upload to a MLTensor while shouldTransferToMLTensor is false");Te("verbose",()=>`[WebNN] uploadTensor {tensorId: ${e}, data: ${t.byteLength}}`),this.tensorManager.upload(e,t)}async downloadTensor(e,t){return this.tensorManager.download(e,t)}createMLTensorDownloader(e,t){return async()=>{let r=await this.tensorManager.download(e);return Qt(r,t)}}registerMLTensor(e,t,r,i){let a=cr.get(r);if(!a)throw new Error(`Unsupported ONNX data type: ${r}`);let n=this.tensorManager.registerTensor(e,t,a,i);return Te("verbose",()=>`[WebNN] registerMLTensor {tensor: ${t}, dataType: ${a}, dimensions: ${i}} -> {tensorId: ${n}}`),n}registerMLConstant(e,t,r,i,a,n,s=!1){if(!n)throw new Error("External mounted files are not available.");let o=e;e.startsWith("./")&&(o=e.substring(2));let u=n.get(o);if(!u)throw new Error(`File with name ${o} not found in preloaded files.`);if(t+r>u.byteLength)throw new Error("Out of bounds: data offset and length exceed the external file data size.");let l=u.slice(t,t+r).buffer,d;switch(a.dataType){case"float32":d=new Float32Array(l);break;case"float16":d=typeof Float16Array<"u"&&Float16Array.from?new Float16Array(l):new Uint16Array(l);break;case"int32":d=new Int32Array(l);break;case"uint32":d=new Uint32Array(l);break;case"int64":if(s){let p=pr(new Uint8Array(l),"int64");d=new Int32Array(p.buffer),a.dataType="int32"}else d=new BigInt64Array(l);break;case"uint64":d=new BigUint64Array(l);break;case"int8":d=new Int8Array(l);break;case"int4":case"uint4":case"uint8":d=new Uint8Array(l);break;default:throw new Error(`Unsupported data type: ${a.dataType} in creating WebNN Constant from external data.`)}return Te("verbose",()=>`[WebNN] registerMLConstant {dataType: ${a.dataType}, shape: ${a.shape}}} ${s?"(Note: it was int64 data type and registered to int32 as workaround)":""}`),i.constant(a,d)}registerGraphInput(e){this.temporaryGraphInputs.push(e)}registerGraphOutput(e){this.temporaryGraphOutputs.push(e)}isGraphInput(e,t){let r=this.sessionGraphInputs.get(e);return r?r.includes(t):!1}isGraphOutput(e,t){let r=this.sessionGraphOutputs.get(e);return r?r.includes(t):!1}isGraphInputOutputTypeSupported(e,t,r=!0){let i=this.mlContextBySessionId.get(e),a=cr.get(vt(t));return typeof a>"u"?!1:r?!!(i!=null&&i.opSupportLimits().input.dataTypes.includes(a)):!!(i!=null&&i.opSupportLimits().output.dataTypes.includes(a))}flush(){}}}),mi=C(()=>{}),gi,yi,qr,wi,_i,bi,na,sa,Aa,cn=C(()=>{Et(),mi(),gi=new Map([[64,250],[128,200],[256,200],[512,200],[2048,230],[4096,200],[8192,50],[16384,50],[32768,50],[65536,50],[131072,50],[262144,50],[524288,50],[1048576,50],[2097152,30],[4194304,20],[8388608,10],[12582912,10],[16777216,10],[26214400,15],[33554432,22],[44236800,2],[58982400,6],[67108864,6],[134217728,6],[167772160,6]]),yi=[],qr=e=>Math.ceil(Number(e)/16)*16,wi=e=>{for(let t=0;t<yi.length;t++){let r=yi[t];if(e<=r)return r}return Math.ceil(e/16)*16},_i=1,bi=()=>_i++,na=async(e,t,r,i)=>{let a=qr(r),n=e.device.createBuffer({size:a,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});try{let s=e.getCommandEncoder();e.endComputePass(),s.copyBufferToBuffer(t,0,n,0,a),e.flush(),await n.mapAsync(GPUMapMode.READ);let o=n.getMappedRange();if(i){let u=i();return u.set(new Uint8Array(o,0,r)),u}else return new Uint8Array(o.slice(0,r))}finally{n.destroy()}},sa=class{constructor(e){this.backend=e,this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.buffersPending=[],this.capturedPendingBuffers=new Map;for(let[t]of gi)yi.push(t),this.freeBuffers.set(t,[]),this.freeUniformBuffers.set(t,[]);this.sessionCount=0}upload(e,t){let r=t.buffer,i=t.byteOffset,a=t.byteLength,n=qr(a),s=this.storageCache.get(e);if(!s)throw new Error("gpu data for uploading does not exist");if(Number(s.originalSize)!==a)throw new Error(`inconsistent data size. gpu data size=${s.originalSize}, data size=${a}`);let o=this.backend.device.createBuffer({mappedAtCreation:!0,size:n,usage:GPUBufferUsage.MAP_WRITE|GPUBufferUsage.COPY_SRC}),u=o.getMappedRange();new Uint8Array(u).set(new Uint8Array(r,i,a)),o.unmap();let l=this.backend.device.createCommandEncoder();l.copyBufferToBuffer(o,0,s.gpuData.buffer,0,n),this.backend.device.queue.submit([l.finish()]),o.destroy(),Te("verbose",()=>`[WebGPU] GpuDataManager.upload(id=${e})`)}memcpy(e,t){let r=this.storageCache.get(e);if(!r)throw new Error("source gpu data for memcpy does not exist");let i=this.storageCache.get(t);if(!i)throw new Error("destination gpu data for memcpy does not exist");if(r.originalSize!==i.originalSize)throw new Error("inconsistent source and destination gpu data size");let a=qr(r.originalSize),n=this.backend.getCommandEncoder();this.backend.endComputePass(),n.copyBufferToBuffer(r.gpuData.buffer,0,i.gpuData.buffer,0,a)}registerExternalBuffer(e,t,r){let i;if(r){if(i=r[0],e===r[1])return Te("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${i}, buffer is the same, skip.`),i;if(this.backend.capturedCommandList.has(this.backend.currentSessionId))throw new Error(`Registering a different external buffer under graph capture mode is not supported yet.
             Please use the previous external buffer!`)}else i=bi();return this.storageCache.set(i,{gpuData:{id:i,type:0,buffer:e},originalSize:t}),Te("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${i}, registered.`),i}unregisterExternalBuffer(e){e!==void 0&&(this.storageCache.delete(e),Te("verbose",()=>`[WebGPU] GpuDataManager.unregisterExternalBuffer() => id=${e}`))}create(e,t=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST){let r=wi(e),i,a=(t&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE,n=(t&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM;if(a||n){let o=(a?this.freeBuffers:this.freeUniformBuffers).get(r);o?o.length>0?i=o.pop():i=this.backend.device.createBuffer({size:r,usage:t}):i=this.backend.device.createBuffer({size:r,usage:t})}else i=this.backend.device.createBuffer({size:r,usage:t});let s={id:bi(),type:0,buffer:i};return this.storageCache.set(s.id,{gpuData:s,originalSize:Number(e)}),Te("verbose",()=>`[WebGPU] GpuDataManager.create(size=${e}) => id=${s.id}`),s}get(e){var t;return(t=this.storageCache.get(e))==null?void 0:t.gpuData}release(e){let t=typeof e=="bigint"?Number(e):e,r=this.storageCache.get(t);if(!r){if(this.storageCache.size===0)return 0;throw new Error("releasing data does not exist")}return Te("verbose",()=>`[WebGPU] GpuDataManager.release(id=${t}), gpuDataId=${r.gpuData.id}`),this.storageCache.delete(t),this.buffersPending.push(r.gpuData.buffer),r.originalSize}async download(e,t){let r=this.storageCache.get(Number(e));if(!r)throw new Error("data does not exist");await na(this.backend,r.gpuData.buffer,r.originalSize,t)}refreshPendingBuffers(){if(this.buffersPending.length!==0)if(this.backend.sessionStatus==="default"){for(let e of this.buffersPending){let t=gi.get(e.size);if((e.usage&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE){let r=this.freeBuffers.get(e.size)||[];t===void 0||r.length>=t?e.destroy():r.push(e)}else if((e.usage&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM){let r=this.freeUniformBuffers.get(e.size)||[];t===void 0||r.length>=t?e.destroy():r.push(e)}else e.destroy()}this.buffersPending=[]}else{let e=this.capturedPendingBuffers.get(this.backend.currentSessionId);e||(e=[],this.capturedPendingBuffers.set(this.backend.currentSessionId,e));for(let t of this.buffersPending)e.push(t);this.buffersPending=[]}}dispose(){this.freeBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.freeUniformBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache.forEach(e=>{e.gpuData.buffer.destroy()}),this.capturedPendingBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.capturedPendingBuffers=new Map}onCreateSession(){this.sessionCount+=1}onReleaseSession(e){let t=this.capturedPendingBuffers.get(e);t&&(t.forEach(r=>{r.destroy()}),this.capturedPendingBuffers.delete(e)),this.sessionCount-=1,this.sessionCount===0&&(Te("warning",()=>"[WebGPU] Clearing webgpu buffer cache"),this.storageCache.forEach(r=>{r.gpuData.buffer.destroy()}),this.storageCache=new Map)}},Aa=(...e)=>new sa(...e)}),c,g,b=C(()=>{c=class{constructor(e){Object.assign(this,e)}get cacheKey(){return this.key||(this.key=Object.getOwnPropertyNames(this).sort().map(e=>`${this[e]}`).join(";")),this.key}},g=e=>new c(e)}),T,$,R,I,E,B,V,G,j,P,ee,O,Z,Le,_e,ye,Me,ie=C(()=>{pe(),ne(),T=64,$=(e,t)=>{if(t===3)throw new Error("vec3 has same alignment as vec4, use vec4 instead");switch(Number(e)){case 10:return t>1?`vec${t}<f16>`:"f16";case 1:return t>1?`vec${t}<f32>`:"f32";case 6:return t>1?`vec${t}<i32>`:"i32";case 12:return t>1?`vec${t}<u32>`:"u32";case 7:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","i32"];case 13:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","u32"];case 9:if(t!==4)throw new Error("bool must be vec4");return["u32","vec4<bool>"];case 22:return"i32";case 21:return"u32";default:throw new Error(`Unknown data type: ${e}`)}},R=(e,t=1)=>{let r=$(e,t);return typeof r=="string"?r:r[0]},I=(e,t=1)=>{let r=$(e,t);return typeof r=="string"?r:r[1]},E=(...e)=>{let t=[];return e.forEach(r=>{r.length!==0&&t.push({type:12,data:r},{type:12,data:U.computeStrides(r)})}),t},B=e=>e%4===0?4:e%2===0?2:1,V=(e="f32",t,r="0")=>!t||t===1?`${e}(${r})`:`vec${t}<${e}>(${r})`,G=(e,t,r)=>e==="f32"?r:t===1?`f32(${r})`:`vec${t}<f32>(${r})`,j=(e,t)=>t===4?`(${e}.x + ${e}.y + ${e}.z + ${e}.w)`:t===2?`(${e}.x + ${e}.y)`:t===3?`(${e}.x + ${e}.y + ${e}.z)`:e,P=(e,t,r,i)=>e.startsWith("uniforms.")&&r>4?typeof t=="string"?i==="f16"?`${e}[(${t}) / 8][(${t}) % 8 / 4][(${t}) % 8 % 4]`:`${e}[(${t}) / 4][(${t}) % 4]`:i==="f16"?`${e}[${Math.floor(t/8)}][${Math.floor(t%8/4)}][${t%8%4}]`:`${e}[${Math.floor(t/4)}][${t%4}]`:r>1?`${e}[${t}]`:e,ee=(e,t,r,i,a)=>{let n=typeof r=="number",s=n?r:r.length,o=[...new Array(s).keys()],u=s<2?"u32":s<=4?`vec${s}<u32>`:`array<u32, ${s}>`,l=$(t,a),d=typeof l=="string"?l:l[1],p=typeof l=="string"?l:l[0],h={indices:u,value:d,storage:p,tensor:t},f=q=>typeof q=="string"?q:`${q}u`,m={offsetToIndices:!1,indicesToOffset:!1,broadcastedIndicesToOffset:!1,set:!1,setByIndices:!1,get:!1,getByIndices:!1},y=n?"uniforms.":"",v=`${y}${e}_shape`,_=`${y}${e}_strides`,w="";for(let q=0;q<s-1;q++)w+=`
    let dim${q} = current / ${P(_,q,s)};
    let rest${q} = current % ${P(_,q,s)};
    indices[${q}] = dim${q};
    current = rest${q};
    `;w+=`indices[${s-1}] = current;`;let S=s<2?"":`
  fn o2i_${e}(offset: u32) -> ${h.indices} {
    var indices: ${h.indices};
    var current = offset;
    ${w}
    return indices;
  }`,x=q=>(m.offsetToIndices=!0,s<2?q:`o2i_${e}(${q})`),z=[];if(s>=2)for(let q=s-1;q>=0;q--)z.push(`${P(_,q,s)} * (indices[${q}])`);let D=s<2?"":`
  fn i2o_${e}(indices: ${h.indices}) -> u32 {
    return ${z.join("+")};
  }`,M=q=>(m.indicesToOffset=!0,s<2?q:`i2o_${e}(${q})`),N=(...q)=>s===0?"0u":`${h.indices}(${q.map(f).join(",")})`,W=(q,Y)=>s<2?`${q}`:`${P(q,Y,s)}`,Q=(q,Y,oe)=>s<2?`${q}=${oe};`:`${P(q,Y,s)}=${oe};`,de={},te=(q,Y)=>{m.broadcastedIndicesToOffset=!0;let oe=`${Y.name}broadcastedIndicesTo${e}Offset`;if(oe in de)return`${oe}(${q})`;let xe=[];for(let kt=s-1;kt>=0;kt--){let xi=Y.indicesGet("outputIndices",kt+Y.rank-s);xe.push(`${W(_,kt)} * (${xi} % ${W(v,kt)})`)}return de[oe]=`fn ${oe}(outputIndices: ${Y.type.indices}) -> u32 {
             return ${xe.length>0?xe.join("+"):"0u"};
           }`,`${oe}(${q})`},ue=(q,Y)=>(()=>{if(h.storage===h.value)return`${e}[${q}]=${Y};`;if(h.storage==="vec2<u32>"&&h.value==="i32")return`${e}[${q}]=vec2<u32>(u32(${Y}), select(0u, 0xFFFFFFFFu, ${Y} < 0));`;if(h.storage==="vec2<u32>"&&h.value==="u32")return`${e}[${q}]=vec2<u32>(u32(${Y}), 0u);`;if(h.storage==="u32"&&h.value==="vec4<bool>")return`${e}[${q}]=dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(${Y}));`;throw new Error(`not supported combination of storage type ${h.storage} and value type ${h.value} yet`)})(),Ae=q=>(()=>{if(h.storage===h.value)return`${e}[${q}]`;if(h.storage==="vec2<u32>"&&h.value==="i32")return`i32(${e}[${q}].x)`;if(h.storage==="vec2<u32>"&&h.value==="u32")return`u32(${e}[${q}].x)`;if(h.storage==="u32"&&h.value==="vec4<bool>")return`vec4<bool>(bool(${e}[${q}] & 0xFFu), bool(${e}[${q}] & 0xFF00u), bool(${e}[${q}] & 0xFF0000u), bool(${e}[${q}] & 0xFF000000u))`;throw new Error(`not supported combination of storage type ${h.storage} and value type ${h.value} yet`)})(),be=s<2?"":`
  fn get_${e}ByIndices(indices: ${h.indices}) -> ${d} {
    return ${Ae(`i2o_${e}(indices)`)};
  }`,se=s<2?"":(()=>{let q=o.map(oe=>`d${oe}: u32`).join(", "),Y=o.map(oe=>`d${oe}`).join(", ");return`
  fn get_${e}(${q}) -> ${d} {
    return get_${e}ByIndices(${N(Y)});
  }`})(),$e=(...q)=>{if(q.length!==s)throw new Error(`indices length must be ${s}`);let Y=q.map(f).join(",");return s===0?Ae("0u"):s===1?Ae(Y[0]):(m.get=!0,m.getByIndices=!0,m.indicesToOffset=!0,`get_${e}(${Y})`)},ae=q=>s<2?Ae(q):(m.getByIndices=!0,m.indicesToOffset=!0,`get_${e}ByIndices(${q})`),fe=s<2?"":`
  fn set_${e}ByIndices(indices: ${h.indices}, value: ${d}) {
    ${ue(`i2o_${e}(indices)`,"value")}
  }`,ot=s<2?"":(()=>{let q=o.map(oe=>`d${oe}: u32`).join(", "),Y=o.map(oe=>`d${oe}`).join(", ");return`
  fn set_${e}(${q}, value: ${d}) {
    set_${e}ByIndices(${N(Y)}, value);
  }`})();return{impl:()=>{let q=[],Y=!1;return m.offsetToIndices&&(q.push(S),Y=!0),m.indicesToOffset&&(q.push(D),Y=!0),m.broadcastedIndicesToOffset&&(Object.values(de).forEach(oe=>q.push(oe)),Y=!0),m.set&&(q.push(ot),Y=!0),m.setByIndices&&(q.push(fe),Y=!0),m.get&&(q.push(se),Y=!0),m.getByIndices&&(q.push(be),Y=!0),!n&&Y&&q.unshift(`const ${v} = ${h.indices}(${r.join(",")});`,`const ${_} = ${h.indices}(${U.computeStrides(r).join(",")});`),q.join(`
`)},type:h,offsetToIndices:x,indicesToOffset:M,broadcastedIndicesToOffset:te,indices:N,indicesGet:W,indicesSet:Q,set:(...q)=>{if(q.length!==s+1)throw new Error(`indices length must be ${s}`);let Y=q[s];if(typeof Y!="string")throw new Error("value must be string");let oe=q.slice(0,s).map(f).join(",");return s===0?ue("0u",Y):s===1?ue(oe[0],Y):(m.set=!0,m.setByIndices=!0,m.indicesToOffset=!0,`set_${e}(${oe}, ${Y})`)},setByOffset:ue,setByIndices:(q,Y)=>s<2?ue(q,Y):(m.setByIndices=!0,m.indicesToOffset=!0,`set_${e}ByIndices(${q}, ${Y});`),get:$e,getByOffset:Ae,getByIndices:ae,usage:i,name:e,strides:_,shape:v,rank:s}},O=(e,t,r,i=1)=>ee(e,t,r,"input",i),Z=(e,t,r,i=1)=>ee(e,t,r,"output",i),Le=(e,t,r)=>ee(e,t,r,"atomicOutput",1),_e=(e,t,r,i=1)=>ee(e,t,r,"internal",i),ye=class{constructor(e,t){this.normalizedDispatchGroup=e,this.limits=t,this.internalVariables=[],this.variables=[],this.uniforms=[],this.variableIndex=0}guardAgainstOutOfBoundsWorkgroupSizes(e){return`if (global_idx >= ${typeof e=="number"?`${e}u`:e}) { return; }`}mainStart(e=T){let t=typeof e=="number"?e:e[0],r=typeof e=="number"?1:e[1],i=typeof e=="number"?1:e[2];if(t>this.limits.maxComputeWorkgroupSizeX||r>this.limits.maxComputeWorkgroupSizeY||i>this.limits.maxComputeWorkgroupSizeZ)throw new Error(`workgroup size [${t}, ${r}, ${i}] exceeds the maximum workgroup size [${this.limits.maxComputeWorkgroupSizeX}, ${this.limits.maxComputeWorkgroupSizeY}, ${this.limits.maxComputeWorkgroupSizeZ}].`);if(t*r*i>this.limits.maxComputeInvocationsPerWorkgroup)throw new Error(`workgroup size [${t}, ${r}, ${i}] exceeds the maximum workgroup invocations ${this.limits.maxComputeInvocationsPerWorkgroup}.`);let a=this.normalizedDispatchGroup[1]===1&&this.normalizedDispatchGroup[2]===1,n=a?`@builtin(global_invocation_id) global_id : vec3<u32>,
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(local_invocation_index) local_idx : u32,
    @builtin(local_invocation_id) local_id : vec3<u32>`:`@builtin(global_invocation_id) global_id : vec3<u32>,
                                             @builtin(local_invocation_id) local_id : vec3<u32>,
    @builtin(local_invocation_index) local_idx : u32,
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(num_workgroups) num_workgroups : vec3<u32>`,s=a?`let global_idx = global_id.x;
         let workgroup_index = workgroup_id.x;`:`let workgroup_index = workgroup_id.z * num_workgroups[0] * num_workgroups[1] +
             workgroup_id.y * num_workgroups[0] + workgroup_id.x;
         let global_idx = workgroup_index * ${t*r*i}u + local_idx;`;return`@compute @workgroup_size(${t}, ${r}, ${i})
  fn main(${n}) {
    ${s}
  `}appendVariableUniforms(e){e.rank!==0&&(e.shape.startsWith("uniforms.")&&this.uniforms.push({name:e.shape.replace("uniforms.",""),type:"u32",length:e.rank}),e.strides.startsWith("uniforms.")&&this.uniforms.push({name:e.strides.replace("uniforms.",""),type:"u32",length:e.rank}))}declareVariable(e,t){if(e.usage==="internal")throw new Error("cannot use internal variable with declareVariable(). use registerInternalVariables() instead.");this.variables.push(e),this.appendVariableUniforms(e);let r=e.usage==="input"?"read":"read_write",i=e.usage==="atomicOutput"?"atomic<i32>":e.type.storage;return`@group(0) @binding(${t}) var<storage, ${r}> ${e.name}: array<${i}>;`}declareVariables(...e){return e.map(t=>this.declareVariable(t,this.variableIndex++)).join(`
`)}registerInternalVariable(e){if(e.usage!=="internal")throw new Error("cannot use input or output variable with registerInternalVariable(). use declareVariables() instead.");this.internalVariables.push(e),this.appendVariableUniforms(e)}registerInternalVariables(...e){return e.forEach(t=>this.registerInternalVariable(t)),this}registerUniform(e,t,r=1){return this.uniforms.push({name:e,type:t,length:r}),this}registerUniforms(e){return this.uniforms=this.uniforms.concat(e),this}uniformDeclaration(){if(this.uniforms.length===0)return"";let e=[];for(let{name:t,type:r,length:i}of this.uniforms)if(i&&i>4)r==="f16"?e.push(`@align(16) ${t}:array<mat2x4<${r}>, ${Math.ceil(i/8)}>`):e.push(`${t}:array<vec4<${r}>, ${Math.ceil(i/4)}>`);else{let a=i==null||i===1?r:`vec${i}<${r}>`;e.push(`${t}:${a}`)}return`
      struct Uniforms { ${e.join(", ")} };
      @group(0) @binding(${this.variableIndex}) var<uniform> uniforms: Uniforms;`}get additionalImplementations(){return this.uniformDeclaration()+this.variables.map(e=>e.impl()).join(`
`)+this.internalVariables.map(e=>e.impl()).join(`
`)}get variablesInfo(){if(this.uniforms.length===0)return;let e=t=>[12,10,1,6][["u32","f16","f32","i32"].indexOf(t)];return this.uniforms.map(t=>[e(t.type),t.length??1])}},Me=(e,t)=>new ye(e,t)}),Ue,Ce,tt,it,gt,Gr,ct,oa,It,at=C(()=>{pe(),ne(),b(),ie(),Ue=(e,t)=>{if(!e||e.length!==1)throw new Error("Transpose requires 1 input.");if(t.length!==0&&t.length!==e[0].dims.length)throw new Error(`perm size ${t.length} does not match input rank ${e[0].dims.length}`)},Ce=(e,t)=>t.length!==0?t:[...new Array(e).keys()].reverse(),tt=(e,t)=>U.sortBasedOnPerm(e,Ce(e.length,t)),it=(e,t,r,i)=>{let a=`fn perm(i: ${i.type.indices}) -> ${r.type.indices} {
    var a: ${r.type.indices};`;for(let n=0;n<t;++n)a+=`a[${e[n]}]=i[${n}];`;return a+="return a;}"},gt=(e,t)=>{let r=[],i=[];for(let a=0;a<e.length;++a)e[a]!==1&&r.push(e[a]),e[t[a]]!==1&&i.push(t[a]);return{newShape:r,newPerm:i}},Gr=(e,t)=>{let r=0;for(let i=0;i<e.length;++i)if(t[e[i]]!==1){if(e[i]<r)return!1;r=e[i]}return!0},ct=(e,t)=>{let r=e.dataType,i=e.dims.length,a=Ce(i,t),n=tt(e.dims,a),s=e.dims,o=n,u=i<2||Gr(a,e.dims),l;if(u)return l=m=>{let y=O("input",r,s,4),v=Z("output",r,o,4);return`
  ${m.registerUniform("output_size","u32").declareVariables(y,v)}
  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    output[global_idx] = input[global_idx];
  }`},{name:"TransposeCopy",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let m=U.size(n);return{outputs:[{dims:n,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(m/64/4)},programUniforms:[{type:12,data:Math.ceil(m/4)}]}},getShaderSource:l};let{newShape:d,newPerm:p}=gt(e.dims,a),h=U.areEqual(p,[2,3,1]),f=U.areEqual(p,[3,1,2]);if(d.length===2||h||f){s=h?[d[0],d[1]*d[2]]:f?[d[0]*d[1],d[2]]:d,o=[s[1],s[0]];let m=16;return l=y=>{let v=O("a",r,s.length),_=Z("output",r,o.length);return`
  ${y.registerUniform("output_size","u32").declareVariables(v,_)}
  var<workgroup> tile : array<array<${_.type.value}, ${m+1}>, ${m}>;
  ${y.mainStart([m,m,1])}
    let stride = (uniforms.output_shape[1] - 1) / ${m} + 1;
    let workgroup_id_x = workgroup_index % stride;
    let workgroup_id_y = workgroup_index / stride;
    let input_col = workgroup_id_y * ${m}u + local_id.x;
    let input_row = workgroup_id_x * ${m}u + local_id.y;
    if (input_row < uniforms.a_shape[0] && input_col < uniforms.a_shape[1]) {
      tile[local_id.y][local_id.x] = ${v.getByIndices(`${v.type.indices}(input_row, input_col)`)};
    }
    workgroupBarrier();

    let output_col = workgroup_id_x * ${m}u + local_id.x;
    let output_row = workgroup_id_y * ${m}u + local_id.y;
    if (output_row < uniforms.output_shape[0] && output_col < uniforms.output_shape[1]) {
      ${_.setByIndices(`${_.type.indices}(output_row, output_col)`,"tile[local_id.x][local_id.y]")}
    }
  }`},{name:"TransposeShared",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let y=U.size(n);return{outputs:[{dims:n,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(o[1]/m),y:Math.ceil(o[0]/m)},programUniforms:[{type:12,data:y},...E(s,o)]}},getShaderSource:l}}return l=m=>{let y=O("a",r,s.length),v=Z("output",r,o.length);return`
  ${m.registerUniform("output_size","u32").declareVariables(y,v)}

  ${it(a,i,y,v)}

  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${v.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${v.setByOffset("global_idx",y.getByIndices("aIndices"))}
  }`},{name:"Transpose",shaderCache:{hint:`${t}`,inputDependencies:["rank"]},getRunData:()=>{let m=U.size(n);return{outputs:[{dims:n,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:[{type:12,data:m},...E(s,o)]}},getShaderSource:l}},oa=(e,t)=>{Ue(e.inputs,t.perm),e.compute(ct(e.inputs[0],t.perm))},It=e=>g({perm:e.perm})}),ua,Ee,Nt,za,Lt,Hr,Ze,ht,vi,jr,St,Oa,Vt,Wt,hr,Qe,Fe,At,Ra,Ba,$s,Sc=C(()=>{pe(),ne(),ie(),fn(),at(),ua={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate * candidate",logSumExp:"bestValue + exp(candidate)",l1:"bestValue + abs(candidate)",l2:"bestValue + candidate * candidate",logSum:"bestValue + candidate"},Ee={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate",logSumExp:"bestValue + candidate",l1:"bestValue + candidate",l2:"bestValue + candidate",logSum:"bestValue + candidate"},Nt={max:"_A[offset]",min:"_A[offset]",mean:"0",sum:"0",prod:"1",sumSquare:"0",logSumExp:"0",l1:"0",l2:"0",logSum:"0"},za={max:"bestValue",min:"bestValue",sum:"bestValue",prod:"bestValue",sumSquare:"bestValue",logSumExp:"log(bestValue)",l1:"bestValue",l2:"sqrt(bestValue)",logSum:"log(bestValue)"},Lt=(e,t)=>{let r=[];for(let i=t-e;i<t;++i)r.push(i);return r},Hr=(e,t)=>{let r=[],i=e.length;for(let n=0;n<i;n++)t.indexOf(n)===-1&&r.push(e[n]);let a=t.map(n=>e[n]);return[r,a]},Ze=(e,t)=>{let r=e.length+t.length,i=[],a=0;for(let n=0;n<r;n++)t.indexOf(n)===-1?i.push(e[a++]):i.push(1);return i},ht=(e,t)=>{for(let r=0;r<e.length;++r)if(e[e.length-r-1]!==t-1-r)return!1;return!0},vi=(e,t)=>{let r=[];if(!ht(e,t)){for(let i=0;i<t;++i)e.indexOf(i)===-1&&r.push(i);e.forEach(i=>r.push(i))}return r},jr=(e,t,r,i,a,n,s)=>{let o=r[0].dims,u=U.size(n),l=U.size(s),d=O("_A",r[0].dataType,o),p=Z("output",a,n),h=64;u===1&&(h=256);let f=`
          var<workgroup> aBestValues : array<f32, ${h}>;
       `,m=y=>`
        ${y.registerUniform("reduceSize","u32").declareVariables(d,p)}
        ${f}
        fn DIV_CEIL(a : u32, b : u32) -> u32 {
          return ((a - 1u) / b + 1u);
         }
         ${y.mainStart(h)}

          let outputIndex = global_idx / ${h};
          let offset = outputIndex * uniforms.reduceSize;

          var bestValue = f32(${Nt[i]});
          let Length = uniforms.reduceSize;
          for (var k = local_idx; k < Length; k = k + ${h}) {
           let candidate = f32(${d.getByOffset("offset + k")});
           bestValue = ${ua[i]};
          }
          aBestValues[local_idx] = bestValue;
          workgroupBarrier();

         var reduceSize = min(Length, ${h}u);
         for (var currentSize = reduceSize / 2u; reduceSize > 1u;
             currentSize = reduceSize / 2u) {
           let interval = DIV_CEIL(reduceSize, 2u);
           if (local_idx < currentSize) {
            let candidate = aBestValues[local_idx + interval];
            bestValue = ${Ee[i]};
            aBestValues[local_idx] = bestValue;
           }
           reduceSize = interval;
           workgroupBarrier();
         }

         if (local_idx == 0u) {
          ${p.setByOffset("outputIndex",`${i==="mean"?`${p.type.storage}(bestValue / f32(uniforms.reduceSize))`:`${p.type.storage}(${za[i]})`}`)};
         }
        }`;return{name:e,shaderCache:{hint:`${t};${h}`,inputDependencies:["type"]},getShaderSource:m,getRunData:()=>({outputs:[{dims:n,dataType:a}],dispatchGroup:{x:u},programUniforms:[{type:12,data:l}]})}},St=(e,t,r,i)=>{let a=e.inputs.length===1?r:hn(e.inputs,r),n=a.axes;n.length===0&&!a.noopWithEmptyAxes&&(n=e.inputs[0].dims.map((f,m)=>m));let s=U.normalizeAxes(n,e.inputs[0].dims.length),o=s,u=e.inputs[0],l=vi(o,e.inputs[0].dims.length);l.length>0&&(u=e.compute(ct(e.inputs[0],l),{inputs:[0],outputs:[-1]})[0],o=Lt(o.length,u.dims.length));let[d,p]=Hr(u.dims,o),h=d;a.keepDims&&(h=Ze(d,s)),e.compute(jr(t,a.cacheKey,[u],i,e.inputs[0].dataType,h,p),{inputs:[u]})},Oa=(e,t)=>{St(e,"ReduceMeanShared",t,"mean")},Vt=(e,t)=>{St(e,"ReduceL1Shared",t,"l1")},Wt=(e,t)=>{St(e,"ReduceL2Shared",t,"l2")},hr=(e,t)=>{St(e,"ReduceLogSumExpShared",t,"logSumExp")},Qe=(e,t)=>{St(e,"ReduceMaxShared",t,"max")},Fe=(e,t)=>{St(e,"ReduceMinShared",t,"min")},At=(e,t)=>{St(e,"ReduceProdShared",t,"prod")},Ra=(e,t)=>{St(e,"ReduceSumShared",t,"sum")},Ba=(e,t)=>{St(e,"ReduceSumSquareShared",t,"sumSquare")},$s=(e,t)=>{St(e,"ReduceLogSumShared",t,"logSum")}}),Ft,xs,Ma,hn,qt,Ss,Ts,Es,Is,ks,Cs,As,zs,Os,Rs,Gt,Bs,Ms,Ds,Ps,Us,Ns,Ls,Vs,Ws,Fs,fn=C(()=>{pe(),ne(),b(),ie(),Sc(),Ft=e=>{if(!e||e.length===0||e.length>2)throw new Error("Reduce op requires 1 or 2 inputs.");if(e.length===2&&e[1].dims.length!==1)throw new Error("Invalid axes input dims.")},xs=e=>["","",`var value = ${e.getByIndices("input_indices")};`,""],Ma=(e,t,r,i,a,n,s=!1,o=!1)=>{let u=[],l=r[0].dims,d=l.length,p=U.normalizeAxes(a,d),h=!o&&p.length===0;l.forEach((y,v)=>{h||p.indexOf(v)>=0?s&&u.push(1):u.push(y)});let f=u.length,m=U.size(u);return{name:e,shaderCache:t,getShaderSource:y=>{let v=[],_=O("_A",r[0].dataType,d),w=Z("output",n,f),S=i(_,w,p),x=S[2];for(let z=0,D=0;z<d;z++)h||p.indexOf(z)>=0?(s&&D++,x=`for(var j${z}: u32 = 0; j${z} < ${l[z]}; j${z}++) {
                  ${S[2].includes("last_index")?`let last_index = j${z};`:""}
                  ${_.indicesSet("input_indices",z,`j${z}`)}
                  ${x}
                }`):(v.push(`${_.indicesSet("input_indices",z,w.indicesGet("output_indices",D))};`),D++);return`

        ${y.registerUniform("output_size","u32").declareVariables(_,w)}

        ${y.mainStart()}
          ${y.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          var input_indices: ${_.type.indices};
          let output_indices = ${w.offsetToIndices("global_idx")};

          ${v.join(`
`)}
          ${S[0]}       // init ops for reduce max/min
          ${S[1]}
          ${x}
          ${S[3]}
          ${S.length===4?w.setByOffset("global_idx","value"):S.slice(4).join(`
`)}
        }`},getRunData:()=>({outputs:[{dims:u,dataType:n}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:[{type:12,data:m},...E(l,u)]})}},hn=(e,t)=>{let r=[];return e[1].dims[0]>0&&e[1].getBigInt64Array().forEach(i=>r.push(Number(i))),g({axes:r,keepDims:t.keepDims,noopWithEmptyAxes:t.noopWithEmptyAxes})},qt=(e,t,r,i)=>{let a=e.inputs,n=a.length===1?r:hn(a,r);e.compute(Ma(t,{hint:n.cacheKey,inputDependencies:["rank"]},[a[0]],n.noopWithEmptyAxes&&n.axes.length===0?xs:i,n.axes,a[0].dataType,n.keepDims,n.noopWithEmptyAxes),{inputs:[0]})},Ss=(e,t)=>{Ft(e.inputs),qt(e,"ReduceLogSum",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += ${r.getByIndices("input_indices")};`,"value = log(value);"])},Ts=(e,t)=>{Ft(e.inputs),qt(e,"ReduceL1",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += abs(${r.getByIndices("input_indices")});`,""])},Es=(e,t)=>{Ft(e.inputs),qt(e,"ReduceL2",t,(r,i)=>[`var t = ${i.type.value}(0); var value = ${i.type.value}(0);`,"",`t = ${r.getByIndices("input_indices")}; value += (t * t);`,"value = sqrt(value);"])},Is=(e,t)=>{Ft(e.inputs),qt(e,"ReduceLogSumExp",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += exp(${r.getByIndices("input_indices")});`,"value = log(value);"])},ks=(e,t)=>{Ft(e.inputs),qt(e,"ReduceMax",t,(r,i,a)=>{let n=[];for(let s=0;s<r.rank;s++)(a.indexOf(s)>=0||a.length===0)&&n.push(r.indicesSet("input_indices",s,0));return[`${n.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};`,`value = max(value, ${r.getByIndices("input_indices")});`,""]})},Cs=(e,t)=>{Ft(e.inputs),qt(e,"ReduceMean",t,(r,i,a)=>{let n=1;for(let s=0;s<r.rank;s++)(a.indexOf(s)>=0||a.length===0)&&(n*=e.inputs[0].dims[s]);return["var sum = f32(0);","",`sum += f32(${r.getByIndices("input_indices")});`,`let value = ${i.type.value}(sum / ${n});`]})},As=(e,t)=>{Ft(e.inputs),qt(e,"ReduceMin",t,(r,i,a)=>{let n=[];for(let s=0;s<r.rank;s++)(a.indexOf(s)>=0||a.length===0)&&n.push(`input_indices[${s}] = 0;`);return[`${n.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};`,`value = min(value, ${r.getByIndices("input_indices")});`,""]})},zs=(e,t)=>{Ft(e.inputs),qt(e,"ReduceProd",t,(r,i)=>[`var value = ${i.type.storage}(1);`,"",`value *= ${r.getByIndices("input_indices")};`,""])},Os=(e,t)=>{Ft(e.inputs),qt(e,"ReduceSum",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += ${r.getByIndices("input_indices")};`,""])},Rs=(e,t)=>{Ft(e.inputs),qt(e,"ReduceSumSquare",t,(r,i)=>[`var t = ${i.type.value}(0); var value = ${i.type.value}(0);`,"",`t = ${r.getByIndices("input_indices")}; value += t * t;`,""])},Gt=(e,t,r)=>{if(t.length===0)return r;let i=1,a=1;for(let n=0;n<t.length;n++)t.indexOf(n)===-1?i*=e[n]:a*=e[n];return a<32&&i>1024},Bs=(e,t)=>{Gt(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Cs(e,t):Oa(e,t)},Ms=(e,t)=>{Gt(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Ts(e,t):Vt(e,t)},Ds=(e,t)=>{Gt(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Es(e,t):Wt(e,t)},Ps=(e,t)=>{Gt(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Is(e,t):hr(e,t)},Us=(e,t)=>{Gt(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?ks(e,t):Qe(e,t)},Ns=(e,t)=>{Gt(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?As(e,t):Fe(e,t)},Ls=(e,t)=>{Gt(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?zs(e,t):At(e,t)},Vs=(e,t)=>{Gt(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Os(e,t):Ra(e,t)},Ws=(e,t)=>{Gt(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Rs(e,t):Ba(e,t)},Fs=(e,t)=>{Gt(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Ss(e,t):$s(e,t)}}),mn,qs,Gs,gn,Tc=C(()=>{pe(),b(),fn(),mn=e=>{if(!e||e.length===0||e.length>2)throw new Error("ArgMinMaxOp op requires 1 or 2 inputs.");if(e[0].dataType!==1)throw new Error("Invalid input type.")},qs=(e,t)=>{mn(e.inputs);let r=(i,a,n)=>{let s=[];for(let o=0;o<i.rank;o++)(n.indexOf(o)>=0||n.length===0)&&s.push(`input_indices[${o}] = 0;`);return[`${s.join(`
`)}`,`var value = ${i.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${i.getByIndices("input_indices")} ${t.selectLastIndex>0?"<=":"<"} value) {
         value = ${i.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",a.setByOffset("global_idx","best_index")]};e.compute(Ma("ArgMin",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],r,[t.axis],7,t.keepDims),{inputs:[0]})},Gs=(e,t)=>{mn(e.inputs);let r=(i,a,n)=>{let s=[];for(let o=0;o<i.rank;o++)(n.indexOf(o)>=0||n.length===0)&&s.push(`input_indices[${o}] = 0;`);return[`${s.join(`
`)}`,`var value = ${i.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${i.getByIndices("input_indices")} ${t.selectLastIndex>0?">=":">"} value) {
         value = ${i.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",a.setByOffset("global_idx","best_index")]};e.compute(Ma("argMax",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],r,[t.axis],7,t.keepDims),{inputs:[0]})},gn=e=>g(e)}),Hs,Da,js,Ks,Zs,la,Qs,Xs,yn=C(()=>{pe(),ne(),mi(),ie(),Hs=(e,t)=>{let r=e[0],i=e[1],a=e[2],n=e[3],s=e[4],o=e[5];if(s&&o)throw new Error("Attention cannot have both past and attention_bias");if(r.dims.length!==3)throw new Error('Input "input" must have 3 dimensions');let u=r.dims[0],l=r.dims[1],d=r.dims[2];if(a.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimensions');if(i.dims.length!==2)throw new Error('Input "weights" is expected to have 2 dimensions');if(i.dims[0]!==d)throw new Error("Input 1 dimension 0 should have same length as dimension 2 of input 0");if(a.dims[0]!==i.dims[1])throw new Error('Input "bias" dimension 0 should have same length as dimension 1 of input "weights"');let p=a.dims[0]/3,h=p,f=h;if(t.qkvHiddenSizes.length>0){if(t.qkvHiddenSizes.length!==3)throw new Error("qkv_hidden_sizes attribute should have 3 elements");for(let S of t.qkvHiddenSizes)if(S%t.numHeads!==0)throw new Error("qkv_hidden_sizes should be divisible by num_heads");p=t.qkvHiddenSizes[0],h=t.qkvHiddenSizes[1],f=t.qkvHiddenSizes[2]}let m=l;if(p!==h)throw new Error("qkv_hidden_sizes first element should be same as the second");if(a.dims[0]!==p+h+f)throw new Error('Input "bias" dimension 0 should have same length as sum of Q/K/V hidden sizes');let y=0;if(s){if(h!==f)throw new Error('Input "past" expect k_hidden_size == v_hidden_size');if(s.dims.length!==5)throw new Error('Input "past" must have 5 dimensions');if(s.dims[0]!==2)throw new Error('Input "past" first dimension must be 2');if(s.dims[1]!==u)throw new Error('Input "past" second dimension must be batch_size');if(s.dims[2]!==t.numHeads)throw new Error('Input "past" third dimension must be num_heads');if(s.dims[4]!==h/t.numHeads)throw new Error('Input "past" fifth dimension must be k_hidden_size / num_heads');t.pastPresentShareBuffer||(y=s.dims[3])}let v=m+y,_=-1,w=0;if(n)throw new Error("Mask not supported");if(s)throw new Error("past is not supported");if(o){if(o.dims.length!==4)throw new Error('Input "attention_bias" must have 4 dimensions');if(o.dims[0]!==u||o.dims[1]!==t.numHeads||o.dims[2]!==l||o.dims[3]!==v)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:u,sequenceLength:l,pastSequenceLength:y,kvSequenceLength:m,totalSequenceLength:v,maxSequenceLength:_,inputHiddenSize:d,hiddenSize:p,vHiddenSize:f,headSize:Math.floor(p/t.numHeads),vHeadSize:Math.floor(f/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:w,scale:t.scale,broadcastResPosBias:!1,passPastInKv:!1,qkvFormat:1}},Da=(e,t,r)=>t&&e?`
      let total_sequence_length_input = u32(${t.getByOffset("0")});
      let present_sequence_length = max(total_sequence_length_input, uniforms.past_sequence_length);
      let is_subsequent_prompt: bool = sequence_length > 1 && sequence_length != total_sequence_length_input;
      let is_first_prompt: bool = is_subsequent_prompt == false && sequence_length == total_sequence_length_input;
      total_sequence_length = u32(${e==null?void 0:e.getByOffset("batchIdx")}) + 1;
      var past_sequence_length: u32 = 0;
      if (is_first_prompt == false) {
        past_sequence_length = total_sequence_length - sequence_length;
      }
       `:`
    ${r?"let past_sequence_length = uniforms.past_sequence_length":""};
    let present_sequence_length = total_sequence_length;
    `,js=(e,t,r,i,a,n,s,o)=>{let u=B(s?1:n),l=64,d=n/u;d<l&&(l=32);let p=Math.ceil(n/u/l),h=[{type:12,data:t},{type:12,data:r},{type:12,data:i},{type:12,data:a},{type:12,data:d},{type:12,data:p}],f=R(e.dataType,u),m=I(1,u),y=["type"];s&&y.push("type"),o&&y.push("type");let v=_=>{let w=Z("x",e.dataType,e.dims,u),S=[w],x=s?O("seq_lens",s.dataType,s.dims):void 0;x&&S.push(x);let z=o?O("total_sequence_length_input",o.dataType,o.dims):void 0;z&&S.push(z);let D=I(e.dataType),M=[{name:"batch_size",type:"u32"},{name:"num_heads",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"sequence_length",type:"u32"},{name:"total_sequence_length",type:"u32"},{name:"elements_per_thread",type:"u32"}];return`
  var<workgroup> thread_max: array<f32, ${l}>;
  var<workgroup> thread_sum: array<f32, ${l}>;
  ${_.registerUniforms(M).declareVariables(...S)}
  ${_.mainStart([l,1,1])}
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let sequence_length = uniforms.sequence_length;
    var total_sequence_length = uniforms.total_sequence_length;
    ${Da(x,z,!1)}
    let local_offset = local_idx * uniforms.elements_per_thread;
    let offset = (global_idx / ${l}) * uniforms.total_sequence_length + local_offset;
    let seq_causal_length = ${s?"u32(past_sequence_length + workgroup_id.y + 1)":"total_sequence_length"};
    var thread_max_vector = ${m}(-3.402823e+38f);
    for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
      thread_max_vector = max(${m}(x[offset + i]), thread_max_vector);
    }
    thread_max[local_idx] = ${(()=>{switch(u){case 1:return"thread_max_vector";case 2:return"max(thread_max_vector.x, thread_max_vector.y)";case 4:return"max(max(thread_max_vector.x, thread_max_vector.y), max(thread_max_vector.z, thread_max_vector.w))";default:throw new Error(`Unsupported components: ${u}`)}})()};
    workgroupBarrier();

    var max_value =  f32(-3.402823e+38f);
    for (var i = 0u; i < ${l}; i++) {
      max_value = max(thread_max[i], max_value);
    }

    var sum_vector = ${m}(0);
    for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
      sum_vector += exp(${m}(x[offset + i]) - max_value);
    }
    thread_sum[local_idx] = ${(()=>{switch(u){case 1:return"sum_vector";case 2:return"sum_vector.x + sum_vector.y";case 4:return"sum_vector.x + sum_vector.y + sum_vector.z + sum_vector.w";default:throw new Error(`Unsupported components: ${u}`)}})()};
    workgroupBarrier();

    var sum: f32 = 0;
    for (var i = 0u; i < ${l}; i++) {
      sum += thread_sum[i];
    }

    if (sum == 0) {
      for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
        x[offset + i] = ${w.type.value}(${D}(1.0) / ${D}(seq_causal_length));
      }
    } else {
      for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
        var f32input = ${m}(x[offset + i]);
        x[offset + i] = ${w.type.value}(exp(f32input - max_value) / sum);
      }
    }
      ${s?`
        for (var total_seq_id: u32 = seq_causal_length; total_seq_id + local_offset < uniforms.total_sequence_length; total_seq_id++) {
          x[offset + total_seq_id] = ${w.type.value}(${D}(0));
        }`:""};
  }`};return{name:"AttentionProbsSoftmax",shaderCache:{hint:`${l};${f};${u}`,inputDependencies:y},getShaderSource:v,getRunData:()=>({outputs:[],dispatchGroup:{x:1,y:a,z:t*r},programUniforms:h})}},Ks=(e,t,r,i,a,n,s,o,u)=>{let l=s+n.kvSequenceLength,d=[n.batchSize,n.numHeads,n.sequenceLength,l],p=e>1&&i,h=n.kvNumHeads?n.kvNumHeads:n.numHeads,f=p?[n.batchSize,h,l,n.headSize]:void 0,m=n.nReps?n.nReps:1,y=n.scale===0?1/Math.sqrt(n.headSize):n.scale,v=B(n.headSize),_=n.headSize/v,w=12,S={x:Math.ceil(l/w),y:Math.ceil(n.sequenceLength/w),z:n.batchSize*n.numHeads},x=[{type:12,data:n.sequenceLength},{type:12,data:_},{type:12,data:l},{type:12,data:n.numHeads},{type:12,data:n.headSize},{type:1,data:y},{type:12,data:s},{type:12,data:n.kvSequenceLength},{type:12,data:m}],z=p&&i&&U.size(i.dims)>0,D=["type","type"];z&&D.push("type"),a&&D.push("type"),o&&D.push("type"),u&&D.push("type");let M=[{dims:d,dataType:t.dataType,gpuDataType:0}];p&&M.push({dims:f,dataType:t.dataType,gpuDataType:0});let N=W=>{let Q=O("q",t.dataType,t.dims,v),de=O("key",r.dataType,r.dims,v),te=[Q,de];if(z){let fe=O("past_key",i.dataType,i.dims,v);te.push(fe)}a&&te.push(O("attention_bias",a.dataType,a.dims));let ue=o?O("seq_lens",o.dataType,o.dims):void 0;ue&&te.push(ue);let Ae=u?O("total_sequence_length_input",u.dataType,u.dims):void 0;Ae&&te.push(Ae);let be=Z("output",t.dataType,d),se=[be];p&&se.push(Z("present_key",t.dataType,f,v));let $e=I(1,v),ae=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"alpha",type:"f32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${w}u;

  var<workgroup> tileQ: array<${Q.type.storage}, ${w*w}>;
  var<workgroup> tileK: array<${Q.type.storage}, ${w*w}>;
  ${W.registerUniforms(ae).declareVariables(...te,...se)}
  ${W.mainStart([w,w,1])}
    // x holds the N and y holds the M
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let kvHeadIdx = ${m===1?"headIdx":"headIdx / uniforms.n_reps"};
    let kv_num_heads = ${m===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let m = workgroup_id.y * TILE_SIZE;
    let n = workgroup_id.x * TILE_SIZE;
    let sequence_length = uniforms.M;
    var total_sequence_length = uniforms.N;
    ${Da(ue,Ae,!0)}
    let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx;
    let qOffset = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
    ${z&&p?"let pastKeyOffset = absKvHeadIdx * uniforms.past_sequence_length * uniforms.K;":""};
    let kOffset = absKvHeadIdx * uniforms.kv_sequence_length * uniforms.K;
    ${p?"let presentKeyOffset = absKvHeadIdx * uniforms.N * uniforms.K;":""}
    var value = ${$e}(0);
    for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (global_id.y < uniforms.M && w + local_id.x < uniforms.K) {
        tileQ[TILE_SIZE * local_id.y + local_id.x] = q[qOffset + local_id.y * uniforms.K + w + local_id.x];
      }
      if (n + local_id.y < uniforms.N && w + local_id.x < uniforms.K) {
        var idx = TILE_SIZE * local_id.y + local_id.x;
      ${z&&p?`
              if (n + local_id.y < past_sequence_length) {
                tileK[idx] = past_key[pastKeyOffset + (n + local_id.y) * uniforms.K + w + local_id.x];
              } else if (n + local_id.y - past_sequence_length < uniforms.kv_sequence_length) {
                tileK[idx] = key[kOffset + (n + local_id.y - past_sequence_length) * uniforms.K + w + local_id.x];
              }`:`
          if (n + local_id.y < uniforms.kv_sequence_length) {
            tileK[idx] = key[kOffset + (n + local_id.y) * uniforms.K + w + local_id.x];
          }`}
      ${p?`if (n + local_id.y < present_sequence_length) {
        present_key[presentKeyOffset + (n + local_id.y) * uniforms.K + w + local_id.x] = tileK[idx];
      }`:""}
      }
      workgroupBarrier();

      for (var k: u32 = 0u; k < TILE_SIZE && w+k < uniforms.K; k++) {
          value += ${$e}(tileQ[TILE_SIZE * local_id.y + k] * tileK[TILE_SIZE * local_id.x + k]);
      }

      workgroupBarrier();
    }

    if (global_id.y < uniforms.M && global_id.x < total_sequence_length) {
      let headOffset = workgroup_id.z * uniforms.M * uniforms.N;
      let outputIdx = headOffset + global_id.y * uniforms.N + global_id.x;
      var sum: f32 = ${(()=>{switch(v){case 1:return"value";case 2:return"value.x + value.y";case 4:return"value.x + value.y + value.z + value.w";default:throw new Error(`Unsupported components: ${v}`)}})()};
        output[outputIdx] = ${be.type.value} (sum * uniforms.alpha) + ${a?"attention_bias[outputIdx]":"0.0"};
    }
  }`};return{name:"AttentionProbs",shaderCache:{hint:`${v};${a!==void 0};${i!==void 0};${e}`,inputDependencies:D},getRunData:()=>({outputs:M,dispatchGroup:S,programUniforms:x}),getShaderSource:N}},Zs=(e,t,r,i,a,n,s=void 0,o=void 0)=>{let u=n+a.kvSequenceLength,l=a.nReps?a.nReps:1,d=a.vHiddenSize*l,p=e>1&&i,h=a.kvNumHeads?a.kvNumHeads:a.numHeads,f=p?[a.batchSize,h,u,a.headSize]:void 0,m=[a.batchSize,a.sequenceLength,d],y=12,v={x:Math.ceil(a.vHeadSize/y),y:Math.ceil(a.sequenceLength/y),z:a.batchSize*a.numHeads},_=[{type:12,data:a.sequenceLength},{type:12,data:u},{type:12,data:a.vHeadSize},{type:12,data:a.numHeads},{type:12,data:a.headSize},{type:12,data:d},{type:12,data:n},{type:12,data:a.kvSequenceLength},{type:12,data:l}],w=p&&i&&U.size(i.dims)>0,S=["type","type"];w&&S.push("type"),s&&S.push("type"),o&&S.push("type");let x=[{dims:m,dataType:t.dataType,gpuDataType:0}];p&&x.push({dims:f,dataType:t.dataType,gpuDataType:0});let z=D=>{let M=O("probs",t.dataType,t.dims),N=O("v",r.dataType,r.dims),W=[M,N];w&&W.push(O("past_value",i.dataType,i.dims));let Q=s?O("seq_lens",s.dataType,s.dims):void 0;s&&W.push(Q);let de=o?O("total_sequence_length_input",o.dataType,o.dims):void 0;o&&W.push(de);let te=[Z("output",t.dataType,m)];p&&te.push(Z("present_value",t.dataType,f));let ue=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"v_hidden_size",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${y}u;
  var<workgroup> tileQ: array<${M.type.value}, ${y*y}>;
  var<workgroup> tileV: array<${M.type.value}, ${y*y}>;
  ${D.registerUniforms(ue).declareVariables(...W,...te)}
  ${D.mainStart([y,y,1])}
   let headIdx = workgroup_id.z % uniforms.num_heads;
   let batchIdx = workgroup_id.z / uniforms.num_heads;
   let kvHeadIdx = ${l===1?"headIdx":"headIdx / uniforms.n_reps"};
   let kv_num_heads = ${l===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
   let m = global_id.y;
   let n = global_id.x;
   let sequence_length = uniforms.M;
   var total_sequence_length = uniforms.K;
   ${Da(Q,de,!0)}
   let offsetA = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
   let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx; // kvHeadIdx is relative to the batch
   ${w&&p?"let pastValueOffset = absKvHeadIdx * uniforms.N * uniforms.past_sequence_length + n;":""};
   let vOffset = absKvHeadIdx * uniforms.N * uniforms.kv_sequence_length + n;
   ${p?"let presentValueOffset = absKvHeadIdx * uniforms.N * uniforms.K + n;":""}
   var value = ${M.type.storage}(0);
   for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (m < uniforms.M && w + local_id.x < uniforms.K) {
        tileQ[TILE_SIZE * local_id.y + local_id.x] = probs[offsetA + w + local_id.x];
      }
      if (n < uniforms.N && w + local_id.y < uniforms.K) {
        var idx = TILE_SIZE * local_id.y + local_id.x;
        ${w&&p?`
        if (w + local_id.y < past_sequence_length) {
          tileV[idx] = past_value[pastValueOffset + (w + local_id.y) * uniforms.N];
        } else if (w + local_id.y - past_sequence_length < uniforms.kv_sequence_length) {
          tileV[idx] = v[vOffset + (w + local_id.y - past_sequence_length) * uniforms.N];
        }
      `:`
            if (w + local_id.y < uniforms.kv_sequence_length) {
              tileV[idx] = v[vOffset + (w + local_id.y) * uniforms.N];
            }`}
        ${p?`
            if (w + local_id.y < present_sequence_length) {
          present_value[presentValueOffset + (w + local_id.y) * uniforms.N] = tileV[idx];
        }`:""}
      }
     workgroupBarrier();
     for (var k: u32 = 0u; k < TILE_SIZE && w+k < total_sequence_length; k++) {
       value += tileQ[TILE_SIZE * local_id.y + k] * tileV[TILE_SIZE * k + local_id.x];
     }
     workgroupBarrier();
   }

   // we need to transpose output from BNSH_v to BSND_v
   if (m < uniforms.M && n < uniforms.N) {
     let outputIdx = batchIdx * uniforms.M * uniforms.v_hidden_size + m * uniforms.v_hidden_size
       + headIdx * uniforms.N + n;
     output[outputIdx] = value;
   }
  }`};return{name:"AttentionScore",shaderCache:{hint:`${i!==void 0};${e}`,inputDependencies:S},getRunData:()=>({outputs:x,dispatchGroup:v,programUniforms:_}),getShaderSource:z}},la=(e,t,r,i,a,n,s,o,u,l,d=void 0,p=void 0)=>{let h=Math.min(e.outputCount,1+(s?1:0)+(o?1:0)),f=h>1?l.pastSequenceLength:0,m=f+l.kvSequenceLength,y=u&&U.size(u.dims)>0?u:void 0,v=[t,r];h>1&&s&&U.size(s.dims)>0&&v.push(s),y&&v.push(y),d&&v.push(d),p&&v.push(p);let _=e.compute(Ks(h,t,r,s,y,l,f,d,p),{inputs:v,outputs:h>1?[-1,1]:[-1]})[0];e.compute(js(_,l.batchSize,l.numHeads,f,l.sequenceLength,m,d,p),{inputs:d&&p?[_,d,p]:[_],outputs:[]});let w=[_,i];h>1&&o&&U.size(o.dims)>0&&w.push(o),d&&w.push(d),p&&w.push(p),e.compute(Zs(h,_,i,o,l,f,d,p),{inputs:w,outputs:h>1?[0,2]:[0]})},Qs=(e,t)=>{let r=[t.batchSize,t.numHeads,t.sequenceLength,t.headSize],i=t.sequenceLength,a=t.inputHiddenSize,n=t.headSize,s=12,o={x:Math.ceil(t.headSize/s),y:Math.ceil(t.sequenceLength/s),z:t.batchSize*t.numHeads},u=[e.inputs[0],e.inputs[1],e.inputs[2]],l=[{type:12,data:i},{type:12,data:a},{type:12,data:n},{type:12,data:t.numHeads},{type:12,data:t.headSize},{type:12,data:t.hiddenSize},{type:12,data:t.hiddenSize+t.hiddenSize+t.vHiddenSize}],d=p=>{let h=Z("output_q",u[0].dataType,r),f=Z("output_k",u[0].dataType,r),m=Z("output_v",u[0].dataType,r),y=O("input",u[0].dataType,u[0].dims),v=O("weight",u[1].dataType,u[1].dims),_=O("bias",u[2].dataType,u[2].dims),w=y.type.storage,S=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"hidden_size",type:"u32"},{name:"ldb",type:"u32"}];return`
  const TILE_SIZE = ${s}u;
  var<workgroup> tileInput: array<${w}, ${s*s}>;
  var<workgroup> tileWeightQ: array<${w}, ${s*s}>;
  var<workgroup> tileWeightK: array<${w}, ${s*s}>;
  var<workgroup> tileWeightV: array<${w}, ${s*s}>;
  ${p.registerUniforms(S).declareVariables(y,v,_,h,f,m)}
  ${p.mainStart([s,s,1])}
    let batchIndex = workgroup_id.z / uniforms.num_heads;
    let headNumber = workgroup_id.z % uniforms.num_heads;
    let m = global_id.y;
    let n = global_id.x;

    let inputOffset = batchIndex * (uniforms.M * uniforms.K) + m * uniforms.K;
    let biasOffsetQ = headNumber * uniforms.head_size;
    let biasOffsetK = uniforms.hidden_size + biasOffsetQ;
    let biasOffsetV = uniforms.hidden_size + biasOffsetK;

    var valueQ = ${w}(0);
    var valueK = ${w}(0);
    var valueV = ${w}(0);
    for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (m < uniforms.M && w + local_id.x < uniforms.K) {
        tileInput[TILE_SIZE * local_id.y + local_id.x] = input[inputOffset + w + local_id.x];
      }
      if (n < uniforms.N && w + local_id.y < uniforms.K) {
        let offset = n + (w + local_id.y) * uniforms.ldb;
        tileWeightQ[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetQ + offset];
        tileWeightK[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetK + offset];
        tileWeightV[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetV + offset];
      }
      workgroupBarrier();
      for (var k: u32 = 0u; k<TILE_SIZE && w+k < uniforms.K; k++) {
        let inputTileOffset = TILE_SIZE * local_id.y + k;
        let weightTileOffset = TILE_SIZE * k + local_id.x;
        valueQ += tileInput[inputTileOffset] * tileWeightQ[weightTileOffset];
        valueK += tileInput[inputTileOffset] * tileWeightK[weightTileOffset];
        valueV += tileInput[inputTileOffset] * tileWeightV[weightTileOffset];
      }

      workgroupBarrier();
    }

    let headOffset = (m * uniforms.N + n) % uniforms.head_size;
    valueQ += bias[headOffset + biasOffsetQ];
    valueK += bias[headOffset + biasOffsetK];
    valueV += bias[headOffset + biasOffsetV];

    let offset = workgroup_id.z * uniforms.M * uniforms.N;
    if (m < uniforms.M && n < uniforms.N) {
      let outputIdx = offset + m * uniforms.N + n;
      output_q[outputIdx] = valueQ;
      output_k[outputIdx] = valueK;
      output_v[outputIdx] = valueV;
    }
  }`};return e.compute({name:"AttentionPrepare",shaderCache:{inputDependencies:["type","type","type"]},getRunData:()=>({outputs:[{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0}],dispatchGroup:o,programUniforms:l}),getShaderSource:d},{inputs:u,outputs:[-1,-1,-1]})},Xs=(e,t)=>{let r=Hs(e.inputs,t),[i,a,n]=Qs(e,r);return la(e,i,a,n,e.inputs[4],void 0,void 0,void 0,e.inputs[5],r)}}),Ys,Js,eo,to,Ec=C(()=>{Je(),pe(),ne(),b(),ie(),Ys=(e,t)=>{if(!e||e.length!==5)throw new Error("BatchNormalization requires 5 inputs");let r=(i,a,n)=>{let s=a.length;if(s!==i.length)throw new Error(`${n}: num dimensions != ${s}`);a.forEach((o,u)=>{if(o!==i[u])throw new Error(`${n}: dim[${u}] do not match`)})};if(e[0].dims.length>1){let i=t.format==="NHWC"?t.spatial?e[0].dims.slice(-1):e[0].dims.slice(-1).concat(e[0].dims.slice(1,e[0].dims.length-1)):e[0].dims.slice(1,t.spatial?2:void 0);r(e[1].dims,i,"Invalid input scale"),r(e[2].dims,i,"Invalid input B"),r(e[3].dims,i,"Invalid input mean"),r(e[4].dims,i,"Invalid input var")}else r(e[1].dims,[1],"Invalid input scale"),r(e[2].dims,[1],"Invalid input B"),r(e[3].dims,[1],"Invalid input mean"),r(e[4].dims,[1],"Invalid input var")},Js=(e,t)=>{let{epsilon:r,spatial:i,format:a}=t,n=e[0].dims,s=i?B(n[n.length-1]):1,o=a==="NHWC"&&n.length>1?s:1,u=U.size(n)/s,l=i,d=l?n.length:n,p=O("x",e[0].dataType,e[0].dims,s),h=O("scale",e[1].dataType,e[1].dims,o),f=O("bias",e[2].dataType,e[2].dims,o),m=O("inputMean",e[3].dataType,e[3].dims,o),y=O("inputVar",e[4].dataType,e[4].dims,o),v=Z("y",e[0].dataType,d,s),_=()=>{let S="";if(i)S=`let cOffset = ${n.length===1?"0u":a==="NHWC"?`outputIndices[${n.length-1}] / ${s}`:"outputIndices[1]"};`;else if(a==="NCHW")S=`
            ${v.indicesSet("outputIndices","0","0")}
            let cOffset = ${v.indicesToOffset("outputIndices")};`;else{S=`var cIndices = ${h.type.indices}(0);
                       cIndices[0] = outputIndices[${n.length-1}];`;for(let x=1;x<h.rank;x++)S+=`cIndices[${x}] = outputIndices[${x}];`;S+=`let cOffset = ${h.indicesToOffset("cIndices")};`}return S},w=S=>`
  const epsilon = ${r};
  ${S.registerUniform("outputSize","u32").declareVariables(p,h,f,m,y,v)}
  ${S.mainStart()}
  ${S.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
    var outputIndices = ${v.offsetToIndices(`global_idx * ${s}`)};
    ${_()}
    let scale = ${h.getByOffset("cOffset")};
    let bias = ${f.getByOffset("cOffset")};
    let inputMean = ${m.getByOffset("cOffset")};
    let inputVar = ${y.getByOffset("cOffset")};
    let x = ${p.getByOffset("global_idx")};
    let value = (x - inputMean) * inverseSqrt(inputVar + epsilon) * scale + bias;
    ${v.setByOffset("global_idx","value")}
  }`;return{name:"BatchNormalization",shaderCache:{hint:`${t.epsilon}_${t.format}_${i}_${s}`,inputDependencies:l?["rank","type","type","type","type"]:void 0},getShaderSource:w,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:l?[{type:12,data:u},...E(n)]:[{type:12,data:u}]})}},eo=e=>g(e),to=(e,t)=>{let{inputs:r,outputCount:i}=e,a=eo({...t,outputCount:i});if(re.webgpu.validateInputContent&&Ys(r,a),t.trainingMode)throw new Error("BatchNormalization trainingMode is not supported yet.");e.compute(Js(r,a))}}),ro,io,ao,Ic=C(()=>{ne(),ie(),ro=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![320,640,1280].includes(e[0].dims[2]))throw new Error("number of channels should be 320, 640 or 1280");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},io=e=>{let t=e[0].dims,r=e[0].dims[2],i=U.size(t)/4,a=e[0].dataType,n=O("input",a,t,4),s=O("bias",a,[r],4),o=O("residual",a,t,4),u=Z("output",a,t,4);return{name:"BiasAdd",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(i/64)}}),getShaderSource:l=>`
  const channels = ${r}u / 4;
  ${l.declareVariables(n,s,o,u)}

  ${l.mainStart()}
    ${l.guardAgainstOutOfBoundsWorkgroupSizes(i)}
    let value = ${n.getByOffset("global_idx")}
      + ${s.getByOffset("global_idx % channels")} + ${o.getByOffset("global_idx")};
    ${u.setByOffset("global_idx","value")}
  }`}},ao=e=>{ro(e.inputs),e.compute(io(e.inputs))}}),no,Oe,so,oo,uo,lo,po,co,ho,fo,mo,go,yo,wo,_o,bo,da,vo,Pa,$o,xo,So,To,Eo,Io,ko,Co,Ao,zo,Oo,Ro,Bo,Mo,Do,Po,wn,Uo,_n,bn,No,Lo,Vo,Wo,Fo,qo,vn=C(()=>{pe(),ne(),b(),ie(),no=(e,t,r,i,a,n,s)=>{let o=Math.ceil(t/4),u="";typeof a=="string"?u=`${a}(a)`:u=a("a");let l=O("inputData",r,[o],4),d=Z("outputData",i,[o],4),p=[{name:"vec_size",type:"u32"}];return s&&p.push(...s),`
      ${e.registerUniforms(p).declareVariables(l,d)}

  ${n??""}

  ${e.mainStart()}
    ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}

    let a = ${l.getByOffset("global_idx")};
    ${d.setByOffset("global_idx",u)}
  }`},Oe=(e,t,r,i,a,n=e.dataType,s,o)=>{let u=[{type:12,data:Math.ceil(U.size(e.dims)/4)}];return s&&u.push(...s),{name:t,shaderCache:{hint:a,inputDependencies:["type"]},getShaderSource:l=>no(l,U.size(e.dims),e.dataType,n,r,i,o),getRunData:l=>({outputs:[{dims:e.dims,dataType:n}],dispatchGroup:{x:Math.ceil(U.size(l[0].dims)/64/4)},programUniforms:u})}},so=e=>{e.compute(Oe(e.inputs[0],"Abs","abs"))},oo=e=>{e.compute(Oe(e.inputs[0],"Acos","acos"))},uo=e=>{e.compute(Oe(e.inputs[0],"Acosh","acosh"))},lo=e=>{e.compute(Oe(e.inputs[0],"Asin","asin"))},po=e=>{e.compute(Oe(e.inputs[0],"Asinh","asinh"))},co=e=>{e.compute(Oe(e.inputs[0],"Atan","atan"))},ho=e=>{e.compute(Oe(e.inputs[0],"Atanh","atanh"))},fo=e=>g(e),mo=(e,t)=>{let r;switch(t.to){case 10:r="vec4<f16>";break;case 1:r="vec4<f32>";break;case 12:r="vec4<u32>";break;case 6:r="vec4<i32>";break;case 9:r="vec4<bool>";break;default:throw new RangeError(`not supported type (specified in attribute 'to' from 'Cast' operator): ${t.to}`)}e.compute(Oe(e.inputs[0],"Cast",r,void 0,t.cacheKey,t.to))},go=e=>{let t,r,i=e.length>=2&&e[1].data!==0,a=e.length>=3&&e[2].data!==0;switch(e[0].dataType){case 1:t=i?e[1].getFloat32Array()[0]:-34028234663852886e22,r=a?e[2].getFloat32Array()[0]:34028234663852886e22;break;case 10:t=i?e[1].getUint16Array()[0]:64511,r=a?e[2].getUint16Array()[0]:31743;break;default:throw new Error("Unsupport data type")}return g({min:t,max:r})},yo=(e,t)=>{let r=t||go(e.inputs),i=I(e.inputs[0].dataType);e.compute(Oe(e.inputs[0],"Clip",a=>`clamp(${a}, vec4<${i}>(uniforms.min), vec4<${i}>(uniforms.max))`,void 0,r.cacheKey,void 0,[{type:e.inputs[0].dataType,data:r.min},{type:e.inputs[0].dataType,data:r.max}],[{name:"min",type:i},{name:"max",type:i}]),{inputs:[0]})},wo=e=>{e.compute(Oe(e.inputs[0],"Ceil","ceil"))},_o=e=>{e.compute(Oe(e.inputs[0],"Cos","cos"))},bo=e=>{e.compute(Oe(e.inputs[0],"Cosh","cosh"))},da=e=>g(e),vo=(e,t)=>{let r=I(e.inputs[0].dataType);e.compute(Oe(e.inputs[0],"Elu",i=>`elu_vf32(${i})`,`
  const elu_alpha_ = ${r}(${t.alpha});

  fn elu_f32(a: ${r}) -> ${r} {
  return select((exp(a) - 1.0) * elu_alpha_, a, a >= 0.0);
  }

  fn elu_vf32(v: vec4<${r}>) -> vec4<${r}> {
  return vec4(elu_f32(v.x), elu_f32(v.y), elu_f32(v.z), elu_f32(v.w));
  }`,t.cacheKey))},Pa=(e="f32")=>`
const r0: ${e} = 0.3275911;
const r1: ${e} = 0.254829592;
const r2: ${e} = -0.284496736;
const r3: ${e} = 1.421413741;
const r4: ${e} = -1.453152027;
const r5: ${e} = 1.061405429;

fn erf_vf32(v: vec4<${e}>) -> vec4<${e}> {
  let absv = abs(v);
  let x = 1.0 / (1.0 + r0 * absv);
  return sign(v) * (1.0 - ((((r5 * x + r4) * x + r3) * x + r2) * x + r1) * x * exp(-absv * absv));
}`,$o=e=>{let t=I(e.inputs[0].dataType);e.compute(Oe(e.inputs[0],"Erf",r=>`erf_vf32(${r})`,Pa(t)))},xo=e=>{e.compute(Oe(e.inputs[0],"Exp","exp"))},So=e=>{e.compute(Oe(e.inputs[0],"Floor","floor"))},To=e=>{let t=I(e.inputs[0].dataType);e.compute(Oe(e.inputs[0],"Gelu",r=>`0.5 * ${r} * (1.0 + erf_vf32(${r} * 0.7071067811865475))`,Pa(t)))},Eo=(e,t)=>{let r=I(e.inputs[0].dataType);e.compute(Oe(e.inputs[0],"LeakyRelu",i=>`select(leaky_relu_alpha_ * ${i}, ${i}, ${i} >= vec4<${r}>(0.0))`,`const leaky_relu_alpha_ = ${r}(${t.alpha});`,t.cacheKey))},Io=e=>{e.compute(Oe(e.inputs[0],"Not",t=>`!${t}`))},ko=e=>{e.compute(Oe(e.inputs[0],"Neg",t=>`-${t}`))},Co=e=>{e.compute(Oe(e.inputs[0],"Reciprocal",t=>`1.0/${t}`))},Ao=e=>{let t=I(e.inputs[0].dataType);e.compute(Oe(e.inputs[0],"Relu",r=>`select(vec4<${t}>(0.0), ${r}, ${r} > vec4<${t}>(0.0))`))},zo=e=>{e.compute(Oe(e.inputs[0],"Sigmoid",t=>`(1.0 / (1.0 + exp(-${t})))`))},Oo=e=>g(e),Ro=(e,t)=>{let r=I(e.inputs[0].dataType);e.compute(Oe(e.inputs[0],"HardSigmoid",i=>`max(vec4<${r}>(0.0), min(vec4<${r}>(1.0), ${t.alpha} * ${i} + vec4<${r}>(${t.beta})))`,void 0,t.cacheKey))},Bo=e=>{e.compute(Oe(e.inputs[0],"Sin","sin"))},Mo=e=>{e.compute(Oe(e.inputs[0],"Sinh","sinh"))},Do=e=>{e.compute(Oe(e.inputs[0],"Sqrt","sqrt"))},Po=e=>{e.compute(Oe(e.inputs[0],"Tan","tan"))},wn=e=>`sign(${e}) * (1 - exp(-2 * abs(${e}))) / (1 + exp(-2 * abs(${e})))`,Uo=e=>{e.compute(Oe(e.inputs[0],"Tanh",wn))},_n=(e="f32")=>`
const fast_gelu_a: ${e} = 0.5;
const fast_gelu_b: ${e} = 0.7978845608028654;
const fast_gelu_c: ${e} = 0.035677408136300125;

fn tanh_v(v: vec4<${e}>) -> vec4<${e}> {
  return ${wn("v")};
}
`,bn=e=>`(fast_gelu_a + fast_gelu_a * tanh_v(${e} * (fast_gelu_c * ${e} * ${e} + fast_gelu_b))) * ${e}`,No=e=>{let t=I(e.inputs[0].dataType);e.compute(Oe(e.inputs[0],"FastGelu",bn,_n(t),void 0,e.inputs[0].dataType))},Lo=(e,t)=>{let r=I(e.inputs[0].dataType);return e.compute(Oe(e.inputs[0],"ThresholdedRelu",i=>`select(vec4<${r}>(0.0), ${i}, ${i} > thresholded_relu_alpha_)`,`const thresholded_relu_alpha_ = vec4<${r}>(${t.alpha});`,t.cacheKey)),0},Vo=e=>{e.compute(Oe(e.inputs[0],"Log","log"))},Wo=(e,t)=>`
const alpha = vec4<${e}>(${t});
const one = ${e}(1.0);
const zero = ${e}(0.0);

fn quick_gelu_impl(x: vec4<${e}>) -> vec4<${e}> {
  let v = x *alpha;
  var x1 : vec4<${e}>;
  for (var i = 0; i < 4; i = i + 1) {
    if (v[i] >= zero) {
      x1[i] = one / (one + exp(-v[i]));
    } else {
      x1[i] = one - one / (one + exp(v[i]));
    }
  }
  return x * x1;
}
`,Fo=e=>`quick_gelu_impl(${e})`,qo=(e,t)=>{let r=I(e.inputs[0].dataType);e.compute(Oe(e.inputs[0],"QuickGelu",Fo,Wo(r,t.alpha),t.cacheKey,e.inputs[0].dataType))}}),Go,Ho,jo,kc=C(()=>{ne(),ie(),vn(),Go=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![2560,5120,10240].includes(e[0].dims[2]))throw new Error("hidden state should be 2560, 5120 or 10240");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},Ho=e=>{let t=e[0].dims.slice();t[2]=t[2]/2;let r=O("input",e[0].dataType,e[0].dims,4),i=O("bias",e[0].dataType,[e[0].dims[2]],4),a=Z("output",e[0].dataType,t,4),n=U.size(t)/4,s=R(e[0].dataType);return{name:"BiasSplitGelu",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(n/64)}}),getShaderSource:o=>`
  const M_SQRT2 = sqrt(2.0);
  const halfChannels = ${e[0].dims[2]/4/2}u;

  ${o.declareVariables(r,i,a)}

  ${Pa(s)}

  ${o.mainStart()}
    ${o.guardAgainstOutOfBoundsWorkgroupSizes(n)}
    let biasIdx = global_idx % halfChannels;
    let batchIndex = global_idx / halfChannels;
    let inputOffset = biasIdx + batchIndex * halfChannels * 2;
    let valueLeft = input[inputOffset] + bias[biasIdx];
    let valueRight = input[inputOffset + halfChannels] + bias[biasIdx + halfChannels];
    let geluRight = valueRight * 0.5 * (erf_vf32(valueRight / M_SQRT2) + 1);

    ${a.setByOffset("global_idx","valueLeft * geluRight")}
  }`}},jo=e=>{Go(e.inputs),e.compute(Ho(e.inputs))}}),Ko,Zo,Ht,Qo,Xo,Yo,Jo,eu,tu,ru,iu,au,nu,Cc=C(()=>{pe(),ne(),ie(),Ko=(e,t,r,i,a,n,s,o,u,l,d,p)=>{let h,f;typeof o=="string"?h=f=(w,S)=>`${o}((${w}),(${S}))`:typeof o=="function"?h=f=o:(h=o.scalar,f=o.vector);let m=Z("outputData",d,i.length,4),y=O("aData",u,t.length,4),v=O("bData",l,r.length,4),_;if(a)if(n){let w=U.size(t)===1,S=U.size(r)===1,x=t.length>0&&t[t.length-1]%4===0,z=r.length>0&&r[r.length-1]%4===0;w||S?_=m.setByOffset("global_idx",f(w?`${y.type.value}(${y.getByOffset("0")}.x)`:y.getByOffset("global_idx"),S?`${v.type.value}(${v.getByOffset("0")}.x)`:v.getByOffset("global_idx"))):_=`
            let outputIndices = ${m.offsetToIndices("global_idx * 4u")};
            let offsetA = ${y.broadcastedIndicesToOffset("outputIndices",m)};
            let offsetB = ${v.broadcastedIndicesToOffset("outputIndices",m)};
            ${m.setByOffset("global_idx",f(s||x?y.getByOffset("offsetA / 4u"):`${y.type.value}(${y.getByOffset("offsetA / 4u")}[offsetA % 4u])`,s||z?v.getByOffset("offsetB / 4u"):`${v.type.value}(${v.getByOffset("offsetB / 4u")}[offsetB % 4u])`))}
          `}else _=m.setByOffset("global_idx",f(y.getByOffset("global_idx"),v.getByOffset("global_idx")));else{if(!n)throw new Error("no necessary to use scalar implementation for element-wise binary op implementation.");let w=(S,x,z="")=>{let D=`aData[indexA${x}][componentA${x}]`,M=`bData[indexB${x}][componentB${x}]`;return`
            let outputIndices${x} = ${m.offsetToIndices(`global_idx * 4u + ${x}u`)};
            let offsetA${x} = ${y.broadcastedIndicesToOffset(`outputIndices${x}`,m)};
            let offsetB${x} = ${v.broadcastedIndicesToOffset(`outputIndices${x}`,m)};
            let indexA${x} = offsetA${x} / 4u;
            let indexB${x} = offsetB${x} / 4u;
            let componentA${x} = offsetA${x} % 4u;
            let componentB${x} = offsetB${x} % 4u;
            ${S}[${x}] = ${z}(${h(D,M)});
          `};d===9?_=`
            var data = vec4<u32>(0);
            ${w("data",0,"u32")}
            ${w("data",1,"u32")}
            ${w("data",2,"u32")}
            ${w("data",3,"u32")}
            outputData[global_idx] = dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(data));`:_=`
            ${w("outputData[global_idx]",0)}
            ${w("outputData[global_idx]",1)}
            ${w("outputData[global_idx]",2)}
            ${w("outputData[global_idx]",3)}
          `}return`
        ${e.registerUniform("vec_size","u32").declareVariables(y,v,m)}

        ${p??""}

        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${_}
      }`},Zo=(e,t,r,i,a,n,s=r.dataType)=>{let o=r.dims.map(y=>Number(y)??1),u=i.dims.map(y=>Number(y)??1),l=!U.areEqual(o,u),d=o,p=U.size(o),h=!1,f=!1,m=[l];if(l){let y=Zt.calcShape(o,u,!1);if(!y)throw new Error("Can't perform binary op on the given tensors");d=y.slice(),p=U.size(d);let v=U.size(o)===1,_=U.size(u)===1,w=o.length>0&&o[o.length-1]%4===0,S=u.length>0&&u[u.length-1]%4===0;m.push(v),m.push(_),m.push(w),m.push(S);let x=1;for(let z=1;z<d.length;z++){let D=o[o.length-z],M=u[u.length-z];if(D===M)x*=D;else break}x%4===0?(f=!0,h=!0):(v||_||w||S)&&(h=!0)}else h=!0;return m.push(h),{name:e,shaderCache:{hint:t+m.map(y=>y.toString()).join("_"),inputDependencies:["rank","rank"]},getShaderSource:y=>Ko(y,o,u,d,h,l,f,a,r.dataType,i.dataType,s,n),getRunData:()=>({outputs:[{dims:d,dataType:s}],dispatchGroup:{x:Math.ceil(p/64/4)},programUniforms:[{type:12,data:Math.ceil(U.size(d)/4)},...E(o,u,d)]})}},Ht=(e,t,r,i,a,n)=>{e.compute(Zo(t,a??"",e.inputs[0],e.inputs[1],r,i,n))},Qo=e=>{Ht(e,"Add",(t,r)=>`${t}+${r}`)},Xo=e=>{Ht(e,"Div",(t,r)=>`${t}/${r}`)},Yo=e=>{Ht(e,"Equal",{scalar:(t,r)=>`u32(${t}==${r})`,vector:(t,r)=>`vec4<u32>(${t}==${r})`},void 0,void 0,9)},Jo=e=>{Ht(e,"Mul",(t,r)=>`${t}*${r}`)},eu=e=>{let t=O("input",e.inputs[0].dataType,e.inputs[0].dims).type.value;Ht(e,"Pow",{scalar:(r,i)=>`pow_custom(${r},${i})`,vector:(r,i)=>`pow_vector_custom(${r},${i})`},`
    fn pow_custom(a : ${t}, b : ${t}) -> ${t} {
      if (b == ${t}(0.0)) {
        return ${t}(1.0);
      } else if (a < ${t}(0.0) && f32(b) != floor(f32(b))) {
        return ${t}(pow(f32(a), f32(b))); // NaN
      }
      return select(sign(a), ${t}(1.0), round(f32(abs(b) % ${t}(2.0))) != 1.0) * ${t}(${t==="i32"?"round":""}(pow(f32(abs(a)), f32(b))));
    }
    fn pow_vector_custom(a : vec4<${t}>, b : vec4<${t}>) -> vec4<${t}> {
      // TODO: implement vectorized pow
      return vec4<${t}>(pow_custom(a.x, b.x), pow_custom(a.y, b.y), pow_custom(a.z, b.z), pow_custom(a.w, b.w));
    }
      `)},tu=e=>{Ht(e,"Sub",(t,r)=>`${t}-${r}`)},ru=e=>{Ht(e,"Greater",{scalar:(t,r)=>`u32(${t}>${r})`,vector:(t,r)=>`vec4<u32>(${t}>${r})`},void 0,void 0,9)},iu=e=>{Ht(e,"Less",{scalar:(t,r)=>`u32(${t}<${r})`,vector:(t,r)=>`vec4<u32>(${t}<${r})`},void 0,void 0,9)},au=e=>{Ht(e,"GreaterOrEqual",{scalar:(t,r)=>`u32(${t}>=${r})`,vector:(t,r)=>`vec4<u32>(${t}>=${r})`},void 0,void 0,9)},nu=e=>{Ht(e,"LessOrEqual",{scalar:(t,r)=>`u32(${t}<=${r})`,vector:(t,r)=>`vec4<u32>(${t}<=${r})`},void 0,void 0,9)}}),su,ou,uu,lu,du,pu,Ac=C(()=>{pe(),ne(),b(),ie(),su=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");let r=0,i=e[r],a=i.dataType,n=i.dims.length;e.forEach((s,o)=>{if(o!==r){if(s.dataType!==a)throw new Error("input tensors should be one type");if(s.dims.length!==n)throw new Error("input tensors should have the same shape");s.dims.forEach((u,l)=>{if(l!==t&&u!==i.dims[l])throw new Error("non concat dimensions must match")})}})},ou=(e,t)=>`
  fn calculateInputIndex(index: u32) -> u32 {
    let sizeInConcatAxis = array<u32, ${e}u>(${t});
    for (var i: u32 = 0u; i < ${e}; i += 1u ) {
      if (index < sizeInConcatAxis[i]) {
        return i;
      }
    }
    return ${e}u;
  }`,uu=(e,t)=>{let r=e.length,i=[];for(let a=0;a<r;++a){let n=t.setByOffset("global_idx",e[a].getByIndices("indices"));r===1?i.push(n):a===0?i.push(`if (inputIndex == ${a}u) { ${n} }`):a===r-1?i.push(`else { ${n} }`):i.push(`else if (inputIndex == ${a}) { ${n} }`)}return i.join(`
`)},lu=(e,t,r,i)=>{let a=U.size(r),n=new Array(e.length),s=new Array(e.length),o=0,u=[],l=[],d=[{type:12,data:a}];for(let y=0;y<e.length;++y)o+=e[y].dims[t],n[y]=o,l.push(e[y].dims.length),s[y]=O(`input${y}`,i,l[y]),u.push("rank"),d.push({type:12,data:n[y]});for(let y=0;y<e.length;++y)d.push(...E(e[y].dims));d.push(...E(r));let p=Z("output",i,r.length),h=p.indicesGet("indices",t),f=Array.from(Array(n.length).keys()).map(y=>`uniforms.sizeInConcatAxis${y}`).join(","),m=y=>`

  ${(()=>{y.registerUniform("outputSize","u32");for(let v=0;v<e.length;v++)y.registerUniform(`sizeInConcatAxis${v}`,"u32");return y.declareVariables(...s,p)})()}

  ${ou(n.length,f)}

  ${y.mainStart()}
    ${y.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

    var indices = ${p.offsetToIndices("global_idx")};

    let inputIndex = calculateInputIndex(${h});
    if (inputIndex != 0u) {
      let sizeInConcatAxis = array<u32, ${n.length}u>(${f});
      ${h} -= sizeInConcatAxis[inputIndex - 1u];
    }

    ${uu(s,p)}
  }`;return{name:"Concat",shaderCache:{hint:`${t}`,inputDependencies:u},getRunData:()=>({outputs:[{dims:r,dataType:i}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:d}),getShaderSource:m}},du=(e,t)=>{let r=e.inputs,i=r[0].dims,a=U.normalizeAxis(t.axis,i.length);su(r,a);let n=i.slice();n[a]=r.reduce((o,u)=>o+(u.dims.length>a?u.dims[a]:0),0);let s=r.filter(o=>U.size(o.dims)>0);e.compute(lu(s,a,n,r[0].dataType),{inputs:s})},pu=e=>g({axis:e.axis})}),Kr,Zr,Qr,$n,Xr=C(()=>{pe(),ne(),Kr=(e,t,r="f32")=>{switch(e.activation){case"Relu":return`value = max(value, ${t}(0.0));`;case"Sigmoid":return`value = (${t}(1.0) / (${t}(1.0) + exp(-value)));`;case"Clip":return`value = clamp(value, ${t}(${r}(uniforms.clip_min)), ${t}(${r}(uniforms.clip_max)));`;case"HardSigmoid":return`value = max(${t}(0.0), min(${t}(1.0), ${r}(uniforms.alpha) * value + ${r}(uniforms.beta)));`;case"LeakyRelu":return`value = select(${r}(uniforms.alpha) * value, value, value >= ${t}(0.0));`;case"Tanh":return`let e2x = exp(-2.0 * abs(value));
              value = sign(value) * (1.0 - e2x) / (1.0 + e2x);
        `;case"":return"";default:throw new Error(`Unsupported activation ${e.activation}`)}},Zr=(e,t)=>{e.activation==="Clip"?t.push({type:1,data:e.clipMax},{type:1,data:e.clipMin}):e.activation==="HardSigmoid"?t.push({type:1,data:e.alpha},{type:1,data:e.beta}):e.activation==="LeakyRelu"&&t.push({type:1,data:e.alpha})},Qr=(e,t)=>{e.activation==="Clip"?t.push({name:"clip_max",type:"f32"},{name:"clip_min",type:"f32"}):e.activation==="HardSigmoid"?t.push({name:"alpha",type:"f32"},{name:"beta",type:"f32"}):e.activation==="LeakyRelu"&&t.push({name:"alpha",type:"f32"})},$n=e=>{let t=(e==null?void 0:e.activation)||"";if(t==="HardSigmoid"){let[r,i]=(e==null?void 0:e.activation_params)||[.2,.5];return{activation:t,alpha:r,beta:i}}else if(t==="Clip"){let[r,i]=(e==null?void 0:e.activation_params)||[Ji,Pt];return{activation:t,clipMax:i,clipMin:r}}else if(t==="LeakyRelu"){let[r]=(e==null?void 0:e.activation_params)||[.01];return{activation:t,alpha:r}}return{activation:t}}}),nt,cu,xn=C(()=>{nt=(e,t)=>{switch(e){case 1:return t;case 2:return`vec2<${t}>`;case 3:return`vec3<${t}>`;case 4:return`vec4<${t}>`;default:throw new Error(`${e}-component is not supported.`)}},cu=e=>`
      ${e?"value = value + getBiasByOutputCoords(coords);":""}
      `}),hu,zc=C(()=>{hu=e=>`
fn getIndexFromCoords4D(coords : vec4<i32>, shape : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
      shape.y * shape.z * shape.w, shape.z * shape.w, shape.w, 1));
}
fn getOutputIndexFromCoords(coords : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
    i32(${e}.x), i32(${e}.y), i32(${e}.z), 1));
}
`}),pa,Sn,Tn=C(()=>{pe(),ne(),ie(),Xr(),pa=(e,t,r,i,a)=>{let n=i-r;return`
      ${Array.from({length:r}).map((s,o)=>`
      if (${P(t.shape,o,t.rank)} != 1) {
        ${t.indicesSet(e,o,P(a,o+n,i))}
      } else {
        ${t.indicesSet(e,o,0)}
      }`).join("")}
`},Sn=(e,t,r,i,a=!1,n)=>{let s=e[0].dims,o=e[1].dims,u=s[s.length-2],l=o[o.length-1],d=s[s.length-1],p=B(l),h=B(d),f=B(u),m=U.size(r)/p/f,y=e.length>2,v=i?i.slice(0,-2):r.slice(0,-2),_=[U.size(v),u,l],w=[{type:12,data:m},{type:12,data:u},{type:12,data:l},{type:12,data:d}];Zr(t,w),w.push(...E(v,s,o)),y&&w.push(...E(e[2].dims)),w.push(...E(_));let S=x=>{let z=_e("batch_dims",e[0].dataType,v.length),D=O("a",e[0].dataType,s.length,h),M=O("b",e[1].dataType,o.length,p),N=Z("output",e[0].dataType,_.length,p),W=R(N.type.tensor),Q=Kr(t,N.type.value,W),de=[D,M],te="";if(y){let be=a?p:1;de.push(O("bias",e[2].dataType,e[2].dims.length,be)),te=`${a?`value += bias[col / ${be}];`:`value += ${N.type.value}(bias[row + i]);`}`}let ue=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"}];Qr(t,ue);let Ae=()=>{let be=`var a_data: ${D.type.value};`;for(let se=0;se<h;se++)be+=`
              let b_data${se} = b[(b_offset + (k + ${se}) * uniforms.N + col) / ${p}];`;for(let se=0;se<f;se++){be+=`a_data = a[(a_offset + (row + ${se}) * uniforms.K + k) / ${h}];`;for(let $e=0;$e<h;$e++)be+=`
            values[${se}] = fma(${M.type.value}(a_data${h===1?"":`[${$e}]`}), b_data${$e}, values[${se}]);
`}return be};return`
  ${x.registerUniforms(ue).registerInternalVariables(z).declareVariables(...de,N)}
  ${x.mainStart()}
    ${x.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let col = (global_idx % (uniforms.N / ${p})) * ${p};
    var index1 = global_idx / (uniforms.N / ${p});
    let stride1 = uniforms.M / ${f};
    let row = (index1 % stride1) * ${f};
    let batch = index1 / stride1;

    ${r.length===2?"":`let batch_indices = ${z.offsetToIndices("batch")};`}

    var a_indices: ${D.type.indices};
    ${pa("a_indices",D,D.rank-2,z.rank,"batch_indices")}
    ${D.indicesSet("a_indices",D.rank-2,0)}
    ${D.indicesSet("a_indices",D.rank-1,0)}
    let a_offset = ${D.indicesToOffset("a_indices")};

    var b_indices: ${M.type.indices};
    ${pa("b_indices",M,M.rank-2,z.rank,"batch_indices")}
    ${M.indicesSet("b_indices",M.rank-2,0)}
    ${M.indicesSet("b_indices",M.rank-1,0)}
    let b_offset = ${M.indicesToOffset("b_indices")};
    var values: array<${N.type.value}, ${f}>;
    for (var k: u32 = 0u; k < uniforms.K; k = k + ${h}) {
      ${Ae()}
    }
    for (var i = 0u; i < ${f}u; i++) {
      var value = values[i];
      ${te}
      ${Q}
      let cur_indices = ${N.type.indices}(batch, row + i, col);
      let offset = ${N.indicesToOffset("cur_indices")};
      ${N.setByOffset(`offset / ${p}`,"value")};
    }
  }
  `};return{name:"MatMulNaive",shaderCache:{hint:`${t.activation};${p};${h};${f};${a}`,inputDependencies:y?["rank","rank","rank"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:n?n(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:w}),getShaderSource:S}}}),fu,mu,En,In,gu,kn,yu,Ua,Cn=C(()=>{pe(),ne(),ie(),Xr(),Tn(),xn(),fu=(e,t)=>e?`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          kStart + inputRow,
          globalRowStart / innerElementSize + inputCol${t?", batchIndices":""});
        `:`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          globalRow + innerRow,
          kStart / innerElementSize + inputCol${t?", batchIndices":""});
        `,mu=(e,t)=>e?`
        let ACached0 = mm_Asub[k * innerElementSize][localRow];
        let ACached1 = mm_Asub[k * innerElementSize + 1][localRow];
        let ACached2 = mm_Asub[k * innerElementSize + 2][localRow];
        ${t===3?"":"let ACached3 = mm_Asub[k * innerElementSize + 3][localRow];"}
        for (var i = 0; i < rowPerThread; i = i + 1) {
          acc[i] = BCached0 * ACached0[i] + acc[i];
          acc[i] = BCached1 * ACached1[i] + acc[i];
          acc[i] = BCached2 * ACached2[i] + acc[i];
          ${t===3?"":"acc[i] = BCached3 * ACached3[i] + acc[i];"}
        }`:`
        for (var i = 0; i < rowPerThread; i = i + 1) {
          let ACached = mm_Asub[tileRow + i][k];
          acc[i] = BCached0 * ACached.x + acc[i];
          acc[i] = BCached1 * ACached.y + acc[i];
          acc[i] = BCached2 * ACached.z + acc[i];
          ${t===3?"":"acc[i] = BCached3 * ACached.w + acc[i];"}
        }`,En=(e,t,r="f32",i,a=!1,n=32,s=!1,o=32)=>{let u=t[1]*e[1],l=t[0]*e[0],d=a?u:n,p=a?n:u,h=d/t[0],f=n/t[1];if(!((a&&h===4&&e[1]===4||!a&&(h===3||h===4))&&d%t[0]===0&&n%t[1]===0&&e[0]===4))throw new Error(`If transposeA ${a} is true, innerElementSize ${h} and workPerThread[1] ${e[1]} must be 4.
      Otherwise, innerElementSize ${h} must be 3 or 4.
  tileAWidth ${d} must be divisible by workgroupSize[0]${t[0]}. tileInner ${n} must be divisible by workgroupSize[1] ${t[1]}. colPerThread ${e[0]} must be 4.`);return`
var<workgroup> mm_Asub: array<array<vec${h}<${r}>, ${d/h}>, ${p}>;
var<workgroup> mm_Bsub: array<array<vec4<${r}>, ${l/e[0]}>, ${n}>;

const rowPerThread = ${e[1]};
const colPerThread = ${e[0]};
const innerElementSize = ${h};
const tileInner = ${n};

@compute @workgroup_size(${t[0]}, ${t[1]}, ${t[2]})
fn main(@builtin(local_invocation_id) localId : vec3<u32>,
        @builtin(global_invocation_id) globalId : vec3<u32>,
        @builtin(workgroup_id) workgroupId : vec3<u32>) {
  let localRow = i32(localId.y);
  let tileRow = localRow * rowPerThread;
  let tileCol = i32(localId.x);

  let globalRow =i32(globalId.y) * rowPerThread;
  let globalCol = i32(globalId.x);
  let batch = ${s?"0":"i32(globalId.z)"};
  ${i?`let batchIndices = ${i.offsetToIndices("u32(batch)")};`:""}
  let globalRowStart = i32(workgroupId.y) * ${u};

  let num_tiles = ${s?`${Math.ceil(o/n)}`:"(uniforms.dim_inner - 1) / tileInner + 1"};
  var kStart = ${s?`i32(globalId.z) * ${o}`:"0"};

  var acc: array<vec4<${r}>, rowPerThread>;

  // Loop over shared dimension.
  let tileRowB = localRow * ${f};
  for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
          let inputRow = tileRow + innerRow;
          let inputCol = tileCol;
          ${fu(a,i)}
      }

      // Load one tile of B into local memory.
      for (var innerRow = 0; innerRow < ${f}; innerRow = innerRow + 1) {
          let inputRow = tileRowB + innerRow;
          let inputCol = tileCol;
          mm_Bsub[inputRow][inputCol] = mm_readB(batch, kStart + inputRow, globalCol${i?", batchIndices":""});
      }
      kStart = kStart + tileInner;
      workgroupBarrier();

      // Compute acc values for a single thread.
      for (var k = 0; k < tileInner / innerElementSize; k = k + 1) {
          let BCached0 = mm_Bsub[k * innerElementSize][tileCol];
          let BCached1 = mm_Bsub[k * innerElementSize + 1][tileCol];
          let BCached2 = mm_Bsub[k * innerElementSize + 2][tileCol];
          ${h===3?"":"let BCached3 = mm_Bsub[k * innerElementSize + 3][tileCol];"}

          ${mu(a,h)}
      }

      workgroupBarrier();
  }

  for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      mm_write(batch, globalRow + innerRow, globalCol, acc[innerRow]);
  }
}`},In=(e,t)=>e?`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              kStart + inputRow,
              globalRowStart + inputCol${t?", batchIndices":""});
            `:`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              globalRowStart + inputRow,
              kStart + inputCol${t?", batchIndices":""});
            `,gu=e=>e?"let ACached = mm_Asub[k][tileRow + innerRow];":"let ACached = mm_Asub[tileRow + innerRow][k];",kn=(e,t,r="f32",i,a=!1,n=32,s=!1,o=32,u=!1)=>{let l=e[1]*t[1],d=e[0]*t[0],p=a?l:n,h=a?n:l;if(!(h%t[1]===0&&p%t[0]===0&&n%t[1]===0))throw new Error(`tileAHight ${h} must be divisible by workgroupSize[1]${t[1]}, tileAWidth ${p} must be divisible by workgroupSize[0]${t[0]}, tileInner ${n} must be divisible by workgroupSize[1]${t[1]}`);let f=h/t[1],m=p/t[0],y=n/t[1],v=u?`
    let localRow = i32(localId.y);
    let localCol = i32(localId.x);
    let globalRowStart = i32(workgroupId.y) * ${l};
    let globalColStart = i32(workgroupId.x) * ${d};

    // Loop over shared dimension.
    for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var inputRow = localRow; inputRow < ${h}; inputRow = inputRow + ${t[1]}) {
        for (var inputCol = localCol; inputCol < ${p}; inputCol = inputCol + ${t[0]}) {
          ${In(a,i)}
        }
      }
      // Load one tile of B into local memory.
      for (var inputRow = localRow; inputRow < ${n}; inputRow = inputRow + ${t[1]}) {
            for (var inputCol = localCol; inputCol < ${d}; inputCol = inputCol + ${t[0]}) {
          mm_Bsub[inputRow][inputCol] = mm_readB(batch,
            kStart + inputRow,
            globalColStart + inputCol${i?", batchIndices":""});
        }
      }
      kStart = kStart + tileInner;
      workgroupBarrier();

      // Compute acc values for a single thread.
      var BCached : array<${r}, colPerThread>;
      for (var k = 0; k < tileInner; k = k + 1) {
        for (var inner = 0; inner < colPerThread; inner = inner + 1) {
          BCached[inner] = mm_Bsub[k][localCol + inner * ${t[0]}];
        }
        for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
          let ACached = ${a?`mm_Asub[k][localRow + innerRow * ${t[1]}];`:`mm_Asub[localRow + innerRow * ${t[1]}][k];`}
          for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
            acc[innerRow][innerCol] = acc[innerRow][innerCol] +
                ACached * BCached[innerCol];
          }
        }
      }
      workgroupBarrier();
    }
    for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      let gRow = globalRowStart + localRow + innerRow * ${t[1]};
      for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
        let gCol = globalColStart + localCol + innerCol * ${t[0]};
        mm_write(batch, gRow, gCol, acc[innerRow][innerCol]);
      }
    }
    `:`
let tileRow = i32(localId.y) * rowPerThread;
let tileCol = i32(localId.x) * colPerThread;

let globalRow = i32(globalId.y) * rowPerThread;
let globalCol = i32(globalId.x) * colPerThread;
let globalRowStart = i32(workgroupId.y) * ${l};

let tileRowA = i32(localId.y) * ${f};
let tileColA = i32(localId.x) * ${m};
let tileRowB = i32(localId.y) * ${y};
// Loop over shared dimension.
for (var t = 0; t < num_tiles; t = t + 1) {
  // Load one tile of A into local memory.
  for (var innerRow = 0; innerRow < ${f}; innerRow = innerRow + 1) {
    for (var innerCol = 0; innerCol < ${m}; innerCol = innerCol + 1) {
      let inputRow = tileRowA + innerRow;
      let inputCol = tileColA + innerCol;
      ${In(a,i)}
    }
  }

  // Load one tile of B into local memory.
  for (var innerRow = 0; innerRow < ${y}; innerRow = innerRow + 1) {
    for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
      let inputRow = tileRowB + innerRow;
      let inputCol = tileCol + innerCol;
      mm_Bsub[inputRow][inputCol] = mm_readB(batch,
        kStart + inputRow,
        globalCol + innerCol${i?", batchIndices":""});
    }
  }
  kStart = kStart + tileInner;
  workgroupBarrier();

  // Compute acc values for a single thread.
  var BCached : array<${r}, colPerThread>;
  for (var k = 0; k < tileInner; k = k + 1) {
    for (var inner = 0; inner < colPerThread; inner = inner + 1) {
      BCached[inner] = mm_Bsub[k][tileCol + inner];
    }

    for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      ${gu(a)}
      for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
        acc[innerRow][innerCol] = acc[innerRow][innerCol] + ACached * BCached[innerCol];
      }
    }
  }

  workgroupBarrier();
}

for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
  for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
    mm_write(batch, globalRow + innerRow, globalCol + innerCol,
        acc[innerRow][innerCol]);
  }
}
`;return`
  var<workgroup> mm_Asub : array<array<${r}, ${p}>, ${h}>;
  var<workgroup> mm_Bsub : array<array<${r}, ${d}>, ${n}>;
  const rowPerThread = ${e[1]};
  const colPerThread = ${e[0]};
  const tileInner = ${n};

@compute @workgroup_size(${t[0]}, ${t[1]}, ${t[2]})
fn main(@builtin(local_invocation_id) localId : vec3<u32>,
        @builtin(global_invocation_id) globalId : vec3<u32>,
        @builtin(workgroup_id) workgroupId : vec3<u32>) {
    let batch = ${s?"0":"i32(globalId.z)"};
    ${i?`let batchIndices = ${i.offsetToIndices("u32(batch)")};`:""}
    let num_tiles = ${s?`${Math.ceil(o/n)}`:"(uniforms.dim_inner - 1) / tileInner + 1"};
    var kStart = ${s?`i32(globalId.z) * ${o}`:"0"};

    var acc : array<array<${r}, colPerThread>, rowPerThread>;
    ${v}
  }
`},yu=(e,t,r,i,a=!1)=>{let[n,s,o,u]=i,l=R(i[0].type.tensor);return`
    fn mm_readA(batch: i32, row: i32, colIn: i32, batchIndices: ${n.type.indices}) -> ${nt(e,l)} {
      var value = ${nt(e,l)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_a_outer && col < uniforms.dim_inner)
      {
        var aIndices: ${s.type.indices};
        ${pa("aIndices",s,s.rank-2,n.rank,"batchIndices")}
        ${s.indicesSet("aIndices",s.rank-2,"u32(row)")}
        ${s.indicesSet("aIndices",s.rank-1,"u32(colIn)")}
        value = ${s.getByIndices("aIndices")};
      }
      return value;
    }

    fn mm_readB(batch: i32, row: i32, colIn: i32, batchIndices: ${n.type.indices}) -> ${nt(e,l)} {
      var value = ${nt(e,l)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_inner && col < uniforms.dim_b_outer)
      {
        var bIndices: ${o.type.indices};
        ${pa("bIndices",o,o.rank-2,n.rank,"batchIndices")}
        ${o.indicesSet("bIndices",o.rank-2,"u32(row)")}
        ${o.indicesSet("bIndices",o.rank-1,"u32(colIn)")}
        value = ${o.getByIndices("bIndices")};
      }
      return value;
    }

    fn mm_write(batch: i32, row: i32, colIn: i32, valueIn: ${nt(e,l)}) {
      let col = colIn * ${e};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer) {
        var value = valueIn;
        let coords = vec3<i32>(batch, row, colIn);
        ${t?`value = value + ${a?"bias[colIn]":`${nt(e,l)}(bias[row])`};`:""}
        ${r}
        ${u.setByIndices("vec3<u32>(coords)","value")}
      }
    }
    `},Ua=(e,t,r,i,a=!1,n)=>{let s=e[0].dims,o=e[1].dims,u=s.slice(0,-2),l=o.slice(0,-2),d=i?i.slice(0,-2):r.slice(0,-2),p=U.size(d),h=s[s.length-2],f=s[s.length-1],m=o[o.length-1],y=f%4===0&&m%4===0,v=h<=8?[4,1,1]:[4,4,1],_=[8,8,1],w=[Math.ceil(m/_[0]/v[0]),Math.ceil(h/_[1]/v[1]),Math.ceil(p/_[2]/v[2])],S=y?4:1,x=[...u,h,f/S],z=x.length,D=[...l,f,m/S],M=D.length,N=[p,h,m/S],W=[{type:6,data:h},{type:6,data:m},{type:6,data:f}];Zr(t,W),W.push(...E(d,x,D));let Q=["rank","rank"],de=e.length>2;de&&(W.push(...E(e[2].dims)),Q.push("rank")),W.push(...E(N));let te=ue=>{let Ae=d.length,be=_e("batchDims",e[0].dataType,Ae,1),se=R(e[0].dataType),$e=O("a",e[0].dataType,z,S),ae=O("b",e[1].dataType,M,S),fe=Z("result",e[0].dataType,N.length,S),ot=[$e,ae];if(de){let kt=a?S:1;ot.push(O("bias",e[2].dataType,e[2].dims.length,kt))}let q=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"}];Qr(t,q);let Y=R(fe.type.tensor),oe=Kr(t,fe.type.value,Y),xe=yu(S,de,oe,[be,$e,ae,fe],a);return`
  ${ue.registerUniforms(q).registerInternalVariables(be).declareVariables(...ot,fe)}
  ${xe}
  ${y?En(v,_,se,be):kn(v,_,se,be)}
                   `};return{name:"MatMul",shaderCache:{hint:`${v};${t.activation};${y};${a}`,inputDependencies:Q},getRunData:()=>({outputs:[{dims:n?n(r):r,dataType:e[0].dataType}],dispatchGroup:{x:w[0],y:w[1],z:w[2]},programUniforms:W}),getShaderSource:te}}}),wu,_u,Oc=C(()=>{pe(),Et(),ie(),Xr(),xn(),zc(),Cn(),wu=(e,t,r,i,a=!1,n,s=4,o=4,u=4,l="f32")=>{let d=W=>{switch(W){case 1:return"resData = x[xIndex];";case 3:return`resData = vec3<${l}>(x[xIndex], x[xIndex + 1], x[xIndex + 2]);`;case 4:return"resData = x[xIndex / 4];";default:throw new Error(`innerElementSize ${W} is not supported.`)}},p=W=>{switch(W){case 1:return"return w[row * i32(uniforms.w_shape[3]) + colIn];";case 4:return"return w[row * i32(uniforms.w_shape[3]) / 4 + colIn];";default:throw new Error(`innerElementSize ${W} is not supported.`)}},h=e?`
    let coord = vec4<i32>(batch, xRow, xCol, xCh);
    `:`
    let coord = vec4<i32>(batch, xCh, xRow, xCol);
    `,f=e?`
    let coords = vec4<i32>(
      batch,
      row / outWidth,
      row % outWidth,
      col);
    `:`
    let coords = vec4<i32>(
      batch,
      row,
      col / outWidth,
      col % outWidth);
    `,m=e?"i32(uniforms.x_shape[1])":"i32(uniforms.x_shape[2])",y=e?"i32(uniforms.x_shape[2])":"i32(uniforms.x_shape[3])",v=e?"row":"col",_=e?"col":"row",w=`
    let inChannels = i32(uniforms.w_shape[2]);
    let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
    let outRow = ${v} / outWidth;
    let outCol = ${v} % outWidth;

    let WRow = ${_} / (i32(uniforms.w_shape[1]) * inChannels);
    let WCol = ${_} / inChannels % i32(uniforms.w_shape[1]);
    let xRow = outRow * uniforms.stride[0] + uniforms.dilation[0] * WRow - uniforms.pad[0];
    let xCol = outCol * uniforms.stride[1] + uniforms.dilation[1] * WCol - uniforms.pad[1];
    let xCh = ${_} % inChannels;
    var resData = ${nt(s,l)}(0.0);
    // The bounds checking is always needed since we use it to pad zero for
    // the 'same' padding type.
    if (xRow >= 0 && xRow < ${m} && xCol >= 0 && xCol < ${y}) {
      ${h}
      let xIndex = getIndexFromCoords4D(coord, vec4<i32>(uniforms.x_shape));
      ${d(s)}
    }
    return resData;`,S=e?t&&i?`
    let col = colIn * ${s};
    ${w}`:`
    let col = colIn * ${s};
    if (row < uniforms.dim_a_outer && col < uniforms.dim_inner) {
      ${w}
    }
    return ${nt(s,l)}(0.0);`:i&&r?`
    let col = colIn * ${s};
    ${w}`:`
    let col = colIn * ${s};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${w}
    }
    return ${nt(s,l)}(0.0);`,x=e?i&&r?p(o):`
    let col = colIn * ${o};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${p(o)}
    }
    return ${nt(o,l)}(0.0);`:`
    let col = colIn * ${o};
    if (row < uniforms.dim_inner && col < uniforms.dim_a_outer) {
      ${p(o)}
    }
    return ${nt(o,l)}(0.0);`,z=nt(u,l),D=nt(e?s:o,l),M=nt(e?o:s,l),N=Kr(n,z,l);return`
    fn mm_readA(batch: i32, row : i32, colIn : i32) -> ${D} {
      ${e?S:x}
    }

    fn mm_readB(batch: i32, row : i32, colIn : i32) -> ${M} {
      ${e?x:S}
    }

    fn mm_write(batch: i32, row : i32, colIn : i32, valueIn : ${z}) {
      let col = colIn * ${u};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer)
      {
      var value = valueIn;
      let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
      ${f}
      ${cu(a)}
      ${N}
      setOutputAtCoords(coords[0], coords[1], coords[2], coords[3], value);
      }
    }`},_u=(e,t,r,i,a,n,s,o,u)=>{let l=t.format==="NHWC",d=l?e[0].dims[3]:e[0].dims[1],p=r[0],h=l?r[2]:r[3],f=l?r[1]:r[2],m=l?r[3]:r[1],y=l&&(d%4===0||d%3===0)&&m%4===0,v=l?m:h*f,_=l?h*f:m,w=[8,8,1],S=i<=8?[4,1,1]:[4,4,1],x=[Math.ceil(v/w[0]/S[0]),Math.ceil(_/w[1]/S[1]),Math.ceil(p/w[2]/S[2])];Te("verbose",()=>`[conv2d_mm_webgpu] dispatch = ${x}`);let z=y?l&&d%4!==0?3:4:1,D=w[1]*S[1],M=w[0]*S[0],N=Math.max(w[0]*z,w[1]),W=i%D===0,Q=a%M===0,de=n%N===0,te=y?[z,4,4]:[1,1,1],ue=[{type:6,data:i},{type:6,data:a},{type:6,data:n},{type:6,data:[t.pads[0],t.pads[1]]},{type:6,data:t.strides},{type:6,data:t.dilations}];Zr(t,ue),ue.push(...E(e[0].dims,e[1].dims));let Ae=["rank","rank"];s&&(ue.push(...E(e[2].dims)),Ae.push("rank")),ue.push(...E(r));let be=se=>{let $e=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"},{name:"pad",type:"i32",length:2},{name:"stride",type:"i32",length:2},{name:"dilation",type:"i32",length:2}];Qr(t,$e);let ae=y?4:1,fe=R(e[0].dataType),ot=`
      fn setOutputAtIndex(flatIndex : i32, value : ${y?`vec4<${fe}>`:fe}) {
        result[flatIndex] = ${y?`vec4<${fe}>`:fe}(value);
      }
      fn setOutputAtCoords(d0 : i32, d1 : i32, d2 : i32, d3 : i32, value : ${y?`vec4<${fe}>`:fe}) {
        let flatIndex = getOutputIndexFromCoords(vec4<i32>(d0, d1, d2, d3));
        setOutputAtIndex(flatIndex ${y?"/ 4":""}, value);
      }`,q=O("x",e[0].dataType,e[0].dims.length,z===3?1:z),Y=O("w",e[1].dataType,e[1].dims.length,ae),oe=[q,Y],xe=Z("result",e[0].dataType,r.length,ae);if(s){let kt=O("bias",e[2].dataType,e[2].dims.length,ae);oe.push(kt),ot+=`
        fn getBiasByOutputCoords(coords : vec4<i32>) -> ${y?`vec4<${fe}>`:fe} {
          return bias[coords.${l?"w":"y"}${y?"/ 4":""}];
        }`}return`
        ${hu("uniforms.result_strides")}
        //struct Uniforms { xShape : vec4<i32>, wShape : vec4<i32>, outShape : vec4<i32>,
        //  outShapeStrides: vec3<i32>, filterDims : vec2<i32>, pad : vec2<i32>, stride : vec2<i32>,
        //  dilation : vec2<i32>, dimAOuter : i32, dimBOuter : i32, dimInner : i32 };
        ${se.registerUniforms($e).declareVariables(...oe,xe)}
        ${ot}
        ${wu(l,W,Q,de,s,t,te[0],te[1],te[2],fe)}
        ${y?En(S,w,fe,void 0,!l,N):kn(S,w,fe,void 0,!l,N,!1,void 0,o)}`};return{name:"Conv2DMatMul",shaderCache:{hint:`${t.cacheKey};${z};${y};${W};${Q};${de};${D};${M};${N}`,inputDependencies:Ae},getRunData:()=>({outputs:[{dims:u?u(r):r,dataType:e[0].dataType}],dispatchGroup:{x:x[0],y:x[1],z:x[2]},programUniforms:ue}),getShaderSource:be}}}),bu,An,ca,vu,zn,$u,xu,Su,Rc=C(()=>{pe(),Et(),ne(),ie(),Xr(),xn(),bu=e=>{let t=1;for(let r=0;r<e.length;r++)t*=e[r];return t},An=e=>typeof e=="number"?[e,e,e]:e,ca=(e,t)=>t<=1?e:e+(e-1)*(t-1),vu=(e,t,r,i=1)=>{let a=ca(t,i);return Math.floor((e[0]*(r-1)-r+a)/2)},zn=(e,t,r,i,a)=>{a==null&&(a=vu(e,t[0],i[0]));let n=[0,0,0,r];for(let s=0;s<3;s++)e[s]+2*a>=t[s]&&(n[s]=Math.trunc((e[s]-t[s]+2*a)/i[s]+1));return n},$u=(e,t,r,i,a,n,s,o,u,l)=>{let d,p,h,f;if(e==="VALID"&&(e=0),typeof e=="number"){d={top:e,bottom:e,left:e,right:e,front:e,back:e};let m=zn([t,r,i,1],[o,u,l],1,[a,n,s],e);p=m[0],h=m[1],f=m[2]}else if(Array.isArray(e)){if(!e.every((y,v,_)=>y===_[0]))throw Error(`Unsupported padding parameter: ${e}`);d={top:e[0],bottom:e[1],left:e[2],right:e[3],front:e[4],back:e[5]};let m=zn([t,r,i,1],[o,u,l],1,[a,n,s],e[0]);p=m[0],h=m[1],f=m[2]}else if(e==="SAME_UPPER"){p=Math.ceil(t/a),h=Math.ceil(r/n),f=Math.ceil(i/s);let m=(p-1)*a+o-t,y=(h-1)*n+u-r,v=(f-1)*s+l-i,_=Math.floor(m/2),w=m-_,S=Math.floor(y/2),x=y-S,z=Math.floor(v/2),D=v-z;d={top:S,bottom:x,left:z,right:D,front:_,back:w}}else throw Error(`Unknown padding parameter: ${e}`);return{padInfo:d,outDepth:p,outHeight:h,outWidth:f}},xu=(e,t,r,i,a,n=!1,s="channelsLast")=>{let o,u,l,d,p;if(s==="channelsLast")[o,u,l,d,p]=e;else if(s==="channelsFirst")[o,p,u,l,d]=e;else throw new Error(`Unknown dataFormat ${s}`);let[h,,f,m,y]=t,[v,_,w]=An(r),[S,x,z]=An(i),D=ca(f,S),M=ca(m,x),N=ca(y,z),{padInfo:W,outDepth:Q,outHeight:de,outWidth:te}=$u(a,u,l,d,v,_,w,D,M,N),ue=n?h*p:h,Ae=[0,0,0,0,0];return s==="channelsFirst"?Ae=[o,ue,Q,de,te]:s==="channelsLast"&&(Ae=[o,Q,de,te,ue]),{batchSize:o,dataFormat:s,inDepth:u,inHeight:l,inWidth:d,inChannels:p,outDepth:Q,outHeight:de,outWidth:te,outChannels:ue,padInfo:W,strideDepth:v,strideHeight:_,strideWidth:w,filterDepth:f,filterHeight:m,filterWidth:y,effectiveFilterDepth:D,effectiveFilterHeight:M,effectiveFilterWidth:N,dilationDepth:S,dilationHeight:x,dilationWidth:z,inShape:e,outShape:Ae,filterShape:t}},Su=(e,t,r,i,a,n)=>{let s=n==="channelsLast";s?e[0].dims[3]:e[0].dims[1];let o=[64,1,1],u={x:r.map((v,_)=>_)},l=[Math.ceil(bu(u.x.map(v=>r[v]))/o[0]),1,1];Te("verbose",()=>`[conv3d_naive_webgpu] dispatch = ${l}`);let d=1,p=U.size(r),h=[{type:12,data:p},{type:12,data:i},{type:12,data:a},{type:12,data:t.strides},{type:12,data:t.dilations}];Zr(t,h),h.push(...E(e[0].dims,e[1].dims));let f=["rank","rank"],m=e.length===3;m&&(h.push(...E(e[2].dims)),f.push("rank")),h.push(...E(r));let y=v=>{let _=[{name:"output_size",type:"u32"},{name:"filter_dims",type:"u32",length:i.length},{name:"pads",type:"u32",length:a.length},{name:"strides",type:"u32",length:t.strides.length},{name:"dilations",type:"u32",length:t.dilations.length}];Qr(t,_);let w=1,S=R(e[0].dataType),x=O("x",e[0].dataType,e[0].dims.length,d),z=O("W",e[1].dataType,e[1].dims.length,w),D=[x,z],M=Z("result",e[0].dataType,r.length,w),N="";if(m){let de=O("bias",e[2].dataType,e[2].dims.length,w);D.push(de),N+=`
        fn getBiasByOutputCoords(coords : array<u32, 5>) -> ${S} {
          return bias[${s?P("coords",4,5):P("coords",1,5)}];
        }`}let W=nt(d,S),Q=Kr(t,W,S);return`
            ${N}
            fn getX(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${x.getByIndices("aIndices")};
            }
            fn getW(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${z.getByIndices("aIndices")};
            }
          ${v.registerUniforms(_).declareVariables(...D,M)}
          ${v.mainStart()}
          ${v.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
              let coords = ${M.offsetToIndices("global_idx")};
              let batch = ${P("coords",0,x.rank)};
              let d2 = ${s?P("coords",x.rank-1,x.rank):P("coords",1,x.rank)};
              let xFRCCorner = vec3<u32>(${s?P("coords",1,x.rank):P("coords",2,x.rank)},
              ${s?P("coords",2,x.rank):P("coords",3,x.rank)},
              ${s?P("coords",3,x.rank):P("coords",4,x.rank)}) * uniforms.strides - uniforms.pads;
              let xFCorner = xFRCCorner.x;
              let xRCorner = xFRCCorner.y;
              let xCCorner = xFRCCorner.z;
              let xShapeY = ${s?P("uniforms.x_shape",1,x.rank):P("uniforms.x_shape",2,x.rank)};
              let xShapeZ = ${s?P("uniforms.x_shape",2,x.rank):P("uniforms.x_shape",3,x.rank)};
              let xShapeW = ${s?P("uniforms.x_shape",3,x.rank):P("uniforms.x_shape",4,x.rank)};
              let xShapeU = ${s?P("uniforms.x_shape",4,x.rank):P("uniforms.x_shape",1,x.rank)};
              let inputDepthNearestVec4 = (xShapeU / 4) * 4;
              let inputDepthVec4Remainder = xShapeU % 4;

              var value = 0.0;
              for (var wF = 0u; wF < uniforms.filter_dims[0]; wF++) {
                let xF = xFCorner + wF * uniforms.dilations[0];
                if (xF < 0 || xF >= xShapeY) {
                  continue;
                }

                for (var wR = 0u; wR < uniforms.filter_dims[1]; wR++) {
                  let xR = xRCorner + wR * uniforms.dilations[1];
                  if (xR < 0 || xR >= xShapeZ) {
                    continue;
                  }

                  for (var wC = 0u; wC < uniforms.filter_dims[2]; wC++) {
                    let xC = xCCorner + wC * uniforms.dilations[2];
                    if (xC < 0 || xC >= xShapeW) {
                      continue;
                    }

                    for (var d1 = 0u; d1 < inputDepthNearestVec4; d1 += 4) {
                      ${s?`let xValues = vec4<f32>(
                               getX(batch, xF, xR, xC, d1),
                               getX(batch, xF, xR, xC, d1 + 1),
                               getX(batch, xF, xR, xC, d1 + 2),
                               getX(batch, xF, xR, xC, d1 + 3));
                            `:`let xValues = vec4<f32>(
                               getX(batch, d1, xF, xR, xC),
                               getX(batch, d1 + 1, xF, xR, xC),
                               getX(batch, d1 + 2, xF, xR, xC),
                               getX(batch, d1 + 3, xF, xR, xC));
                            `}
                            let wValues = vec4<f32>(
                              getW(d2, d1, wF, wR, wC),
                              getW(d2, d1 + 1, wF, wR, wC),
                              getW(d2, d1 + 2, wF, wR, wC),
                              getW(d2, d1 + 3, wF, wR, wC));
                      value += dot(xValues, wValues);
                    }
                    if (inputDepthVec4Remainder == 1) {
                        ${s?`value += getX(batch, xF, xR, xC, inputDepthNearestVec4)
                          * getW(d2, inputDepthNearestVec4, wF, wR, wC);`:`value += getX(batch, inputDepthNearestVec4, xF, xR, xC)
                          * getW(d2, inputDepthNearestVec4, wF, wR, wC);`}
                    } else if (inputDepthVec4Remainder == 2) {
                      ${s?`let xValues = vec2<f32>(
                        getX(batch, xF, xR, xC, inputDepthNearestVec4),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 1));
                      `:`let xValues = vec2<f32>(
                        getX(batch, inputDepthNearestVec4, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 1, xF, xR, xC));
                    `}
                    let wValues = vec2<f32>(
                      getW(d2, inputDepthNearestVec4, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 1, wF, wR, wC));
                      value += dot(xValues, wValues);
                    } else if (inputDepthVec4Remainder == 3) {
                      ${s?`let xValues = vec3<f32>(
                        getX(batch, xF, xR, xC, inputDepthNearestVec4),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 1),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 2));
                      `:`let xValues = vec3<f32>(
                        getX(batch, inputDepthNearestVec4, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 1, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 2, xF, xR, xC));
                    `}
                    let wValues = vec3<f32>(
                      getW(d2, inputDepthNearestVec4, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 1, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 2, wF, wR, wC));
                      value += dot(xValues, wValues);
                    }
                  }
                }
              }
              ${m?"value = value + getBiasByOutputCoords(coords)":""};
              ${Q}
              result[global_idx] = f32(value);
          }`};return{name:"Conv3DNaive",shaderCache:{hint:`${t.cacheKey};${s};${d};${m}`,inputDependencies:f},getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:l[0],y:l[1],z:l[2]},programUniforms:h}),getShaderSource:y}}}),Tu,Eu,Bc=C(()=>{pe(),ne(),ie(),Xr(),Tu=(e,t,r,i)=>{let a=e.length>2,n=a?"value += b[output_channel];":"",s=e[0].dims,o=e[1].dims,u=t.format==="NHWC",l=u?r[3]:r[1],d=l/t.group,p=u&&d>=4?B(l):1,h=U.size(r)/p,f=[{type:12,data:h},{type:12,data:t.dilations},{type:12,data:[t.strides[0],t.strides[1]]},{type:12,data:[t.pads[0],t.pads[1]]},{type:12,data:d}];Zr(t,f),f.push(...E(s,[o[0],o[1],o[2],o[3]/p]));let m=a?["rank","rank","rank"]:["rank","rank"];f.push(...E([r[0],r[1],r[2],r[3]/p]));let y=v=>{let _=Z("output",e[0].dataType,r.length,p),w=R(_.type.tensor),S=Kr(t,_.type.value,w),x=O("x",e[0].dataType,s.length),z=O("w",e[1].dataType,o.length,p),D=[x,z];a&&D.push(O("b",e[2].dataType,e[2].dims,p));let M=[{name:"output_size",type:"u32"},{name:"dilations",type:"u32",length:t.dilations.length},{name:"strides",type:"u32",length:2},{name:"pads",type:"u32",length:2},{name:"output_channels_per_group",type:"u32"}];Qr(t,M);let N=u?`
      for (var wHeight: u32 = 0u; wHeight < uniforms.w_shape[0]; wHeight++) {
        let xHeight = xRCCorner.x + wHeight * uniforms.dilations[0];

        if (xHeight < 0u || xHeight >= uniforms.x_shape[1]) {
          continue;
        }

        for (var wWidth: u32 = 0u; wWidth < uniforms.w_shape[1]; wWidth++) {
          let xWidth = xRCCorner.y + wWidth * uniforms.dilations[1];
          if (xWidth < 0u || xWidth >= uniforms.x_shape[2]) {
            continue;
          }

          for (var wInChannel: u32 = 0u; wInChannel < uniforms.w_shape[2]; wInChannel++) {
            let input_channel = in_channel_offset + wInChannel;
            let xVal = ${x.get("batch","xHeight","xWidth","input_channel")};
            let wVal = ${z.get("wHeight","wWidth","wInChannel","output_channel")};
            value += xVal * wVal;
          }
        }
      }
      `:`
      for (var wInChannel: u32 = 0u; wInChannel < uniforms.w_shape[1]; wInChannel++) {
        let input_channel = in_channel_offset + wInChannel;
        for (var wHeight: u32 = 0u; wHeight < uniforms.w_shape[2]; wHeight++) {
          let xHeight = xRCCorner.x + wHeight * uniforms.dilations[0];

          if (xHeight < 0u || xHeight >= uniforms.x_shape[2]) {
            continue;
          }

          for (var wWidth: u32 = 0u; wWidth < uniforms.w_shape[3]; wWidth++) {
            let xWidth = xRCCorner.y + wWidth * uniforms.dilations[1];
            if (xWidth < 0u || xWidth >= uniforms.x_shape[3]) {
              continue;
            }

            let xVal = ${x.get("batch","input_channel","xHeight","xWidth")};
            let wVal = ${z.get("output_channel","wInChannel","wHeight","wWidth")};
            value += xVal * wVal;
          }
        }
      }
      `;return`
  ${v.registerUniforms(M).declareVariables(...D,_)}

  ${v.mainStart()}
    ${v.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let outputIndices = ${_.offsetToIndices("global_idx")};
    let batch: u32 = outputIndices[0];
    let output_channel: u32 = outputIndices[${u?3:1}];
    let xRCCorner: vec2<u32> = vec2<u32>(outputIndices[${u?1:2}], outputIndices[${u?2:3}]) * uniforms.strides - uniforms.pads;
    let group_id: u32 = output_channel * ${p} / uniforms.output_channels_per_group;
    var in_channel_offset = group_id * uniforms.w_shape[${u?2:1}];

    var value: ${_.type.value} = ${_.type.value}(0);
    ${N}
    ${n}
    ${S}
    ${_.setByOffset("global_idx","value")}
  }`};return{name:"GroupedConv",shaderCache:{hint:`${t.cacheKey}_${p}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:i?i(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(h/64)},programUniforms:f}),getShaderSource:y}},Eu=(e,t,r,i)=>{let a=e.length>2,n=B(r[3]),s=B(r[2]),o=U.size(r)/n/s,u=[e[0].dims[0],e[0].dims[1],e[0].dims[2],e[0].dims[3]/n],l=[e[1].dims[0],e[1].dims[1],e[1].dims[2],e[1].dims[3]/n],d=[r[0],r[1],r[2],r[3]/n],p=[{type:12,data:o},{type:6,data:[t.strides[0],t.strides[1]]},{type:6,data:[t.pads[0],t.pads[1]]}];Zr(t,p),p.push(...E(u,l,d));let h=(s-1)*t.strides[1]+l[1],f=m=>{let y=Z("output",e[0].dataType,d.length,n),v=R(y.type.tensor),_=Kr(t,y.type.value,v),w=O("x",e[0].dataType,u.length,n),S=O("w",e[1].dataType,l.length,n),x=[w,S];a&&x.push(O("b",e[2].dataType,e[2].dims,n));let z=a?"value += b[output_channel];":"",D=[{name:"output_size",type:"u32"},{name:"strides",type:"i32",length:2},{name:"pads",type:"i32",length:2}];return Qr(t,D),`
  ${m.registerUniforms(D).declareVariables(...x,y)}
  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let width0 = uniforms.output_shape[3];
    let output_channel = global_idx % width0;
    var index1 = global_idx / width0;
    let width1 = uniforms.output_shape[2] / ${s}u;
    let col = (index1 % width1) * ${s}u;
    index1 = index1 / width1;
    let row = index1 % uniforms.output_shape[1];
    let batch = index1 / uniforms.output_shape[1];

    let x_corner = vec2<i32>(i32(row), i32(col)) * uniforms.strides - uniforms.pads;

    var x_vals: array<${w.type.value}, ${h}>;
    var values: array<${y.type.value}, ${s}>;
    let input_channel = output_channel;
    // Use constant instead of uniform can give better performance for w's height/width.
    for (var w_height: u32 = 0u; w_height < ${l[0]}; w_height++) {
      let x_height = x_corner.x + i32(w_height);
      if (x_height >= 0 && u32(x_height) < uniforms.x_shape[1]) {
        for (var i = 0; i < ${h}; i++) {
          let x_width = x_corner.y + i;
          if (x_width >= 0 && u32(x_width) < uniforms.x_shape[2]) {
            x_vals[i] = ${w.get("batch","u32(x_height)","u32(x_width)","input_channel")};
          } else {
            x_vals[i] = ${w.type.value}(0);
          }
        }
        for (var w_width: u32 = 0u; w_width < ${l[1]}; w_width++) {
          let w_val = ${S.get("w_height","w_width","0","output_channel")};
          for (var i = 0u; i < ${s}u; i++) {
            values[i] = fma(x_vals[i * u32(uniforms.strides[1]) + w_width], w_val, values[i]);
          }
        }
      }
    }

    for (var i = 0u; i < ${s}u; i++) {
      var value = values[i];
      ${z}
      ${_}
      ${y.set("batch","row","col + i","output_channel","value")};
    }
  }`};return{name:"GroupedConv-Vectorize",shaderCache:{hint:`${t.cacheKey};${n};${s};${h};${l[0]};${l[1]}`,inputDependencies:a?["rank","rank","type"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:i?i(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(o/64)},programUniforms:p}),getShaderSource:f}}}),Iu,Na,ku,La,On,Rn,Cu,Au,Bn,Mc=C(()=>{ne(),Oc(),Rc(),Cn(),Bc(),Xr(),Tn(),at(),Iu=(e,t,r,i,a,n)=>{let s=e[0],o=e.slice(n?1:2,n?3:4),u=o.length,l=t[0],d=t.slice(2).map((h,f)=>h+(h-1)*(r[f]-1)),p=o.map((h,f)=>h+i[f]+i[f+u]).map((h,f)=>Math.floor((h-d[f]+a[f])/a[f]));return p.splice(0,0,s),p.splice(n?3:1,0,l),p},Na=[2,3,1,0],ku=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length>5)throw new Error("greater than 5D is not supported");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let r=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],i=e[1].dims[1]*t.group;if(r!==i)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");if(e.length===3&&(e[2].dims.length!==1||e[1].dims[0]!==e[2].dims[0]))throw new Error("invalid bias");let a=e[0].dims.length-2;if(t.dilations.length!==a)throw new Error(`dilations should be ${a}D`);if(t.strides.length!==a)throw new Error(`strides should be ${a}D`);if(t.pads.length!==a*2)throw new Error(`pads should be ${a*2}D`);if(t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape")},La=(e,t)=>{let r=e.kernelShape.slice();r.length<t[1].dims.length-2&&r.push(...Array(t[1].dims.length-2-r.length).fill(0));for(let n=2;n<t[1].dims.length;++n)r[n-2]===0&&(r[n-2]=t[1].dims[n]);let i=e.pads.slice();lr.adjustPadsBasedOnAutoPad(t[0].dims,e.strides,e.dilations,r,i,e.format==="NHWC",e.autoPad);let a=Object.assign({},e);return Object.assign(a,{kernelShape:r,pads:i}),a},On=e=>{let t=$n(e),r=e.format,i=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],a=e.dilations,n=e.group,s=e.kernel_shape,o=e.pads,u=e.strides,l=e.w_is_const();return{autoPad:i,format:r,dilations:a,group:n,kernelShape:s,pads:o,strides:u,wIsConst:l,...t,cacheKey:`${e.format};${t.activation};`}},Rn=(e,t,r,i)=>{let a=r.format==="NHWC",n=Iu(t[0].dims,t[1].dims,r.dilations,r.pads,r.strides,a);if(r.group!==1){let D=[t[0]];if(a){let M=e.kernelCustomData.wT??e.compute(ct(t[1],Na),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=M),D.push(M)}else D.push(t[1]);t.length===3&&D.push(t[2]),!e.adapterInfo.isArchitecture("ampere")&&a&&t[1].dims[0]===r.group&&t[1].dims[1]===1&&r.dilations[0]===1&&r.dilations[1]===1?e.compute(Eu(D,r,n,i),{inputs:D}):e.compute(Tu(D,r,n,i),{inputs:D});return}let s=t.length===3,o=t[0].dims[a?1:2],u=t[0].dims[a?2:3],l=t[0].dims[a?3:1],d=t[1].dims[2],p=t[1].dims[3],h=n[a?1:2],f=n[a?2:3],m=n[a?3:1],y=a&&d===o&&p===u&&r.pads[0]===0&&r.pads[1]===0;if(y||d===1&&p===1&&r.dilations[0]===1&&r.dilations[1]===1&&r.strides[0]===1&&r.strides[1]===1&&r.pads[0]===0&&r.pads[1]===0){let D=n[0],M,N,W,Q=[];if(a){let ue=e.kernelCustomData.wT??e.compute(ct(t[1],Na),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];if(r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=ue),y){let Ae=o*u*l;M=t[0].reshape([1,D,Ae]),N=ue.reshape([1,Ae,m]),W=[1,D,m]}else M=t[0].reshape([D,o*u,l]),N=ue.reshape([1,l,m]),W=[D,h*f,m];Q.push(M),Q.push(N)}else M=t[0].reshape([D,l,o*u]),N=t[1].reshape([1,m,l]),W=[D,m,h*f],Q.push(N),Q.push(M);s&&Q.push(t[2]);let de=W[2],te=Q[0].dims[Q[0].dims.length-1];de<8&&te<8?e.compute(Sn(Q,r,n,W,a,i),{inputs:Q}):e.compute(Ua(Q,r,n,W,a,i),{inputs:Q});return}let v=!0,_=e.kernelCustomData.wT??e.compute(ct(t[1],Na),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=_);let w=[t[0],_];s&&w.push(t[2]);let S=a?h*f:m,x=a?m:h*f,z=d*p*l;e.compute(_u(w,r,n,S,x,z,s,v,i),{inputs:w})},Cu=(e,t)=>{let r=t.format==="NHWC",i=[e.inputs[0].reshape(r?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&i.push(e.inputs[2]);let a=[0,t.pads[0],0,t.pads[1]],n=[1].concat(t.strides),s=[1].concat(t.dilations),o=[1].concat(t.kernelShape),u=La({...t,pads:a,strides:n,dilations:s,kernelShape:o},i);Rn(e,i,u,l=>r?[l[0],l[2],l[3]]:[l[0],l[1],l[3]])},Au=(e,t,r)=>{let i=r.format==="NHWC"?"channelsLast":"channelsFirst",a=La(r,t),n=r.autoPad==="NOTSET"?r.pads:r.autoPad,s=xu(t[0].dims,t[1].dims,r.strides,r.dilations,n,!1,i);e.compute(Su(t,a,s.outShape,[s.filterDepth,s.filterHeight,s.filterWidth],[s.padInfo.front,s.padInfo.top,s.padInfo.left],i))},Bn=(e,t)=>{if(ku(e.inputs,t),e.inputs[0].dims.length===3)Cu(e,t);else if(e.inputs[0].dims.length===5)Au(e,e.inputs,t);else{let r=La(t,e.inputs);Rn(e,e.inputs,r)}}}),zu,Dc=C(()=>{pe(),Et(),ne(),ie(),zu=(e,t,r)=>{let i=e.length>2,a=t.outputShape,n=t.format==="NHWC",s=t.group,o=e[1].dims,u=o[2]/s,l=o[3],d=n?B(u):1,p=n&&l===1&&u>=4,h=p?Math.floor(u/4)*4:Math.floor(u/d)*d,f=u-h,m=n?B(l):1,y=n?l===1?d:m:1,v=U.size(a)/m,_=[Math.ceil(v/64),1,1];Te("verbose",()=>`[conv2d_backprop_webgpu] dispatch = ${_}`);let w=["rank","rank"],S=[t.strides[0],t.strides[1]],x=[t.kernelShape[n?1:2],t.kernelShape[n?2:3]],z=[t.dilations[0],t.dilations[1]],D=[x[0]+(t.dilations[0]<=1?0:(t.kernelShape[n?1:2]-1)*(t.dilations[0]-1)),x[1]+(t.dilations[1]<=1?0:(t.kernelShape[n?2:3]-1)*(t.dilations[1]-1))],M=[D[0]-1-Math.floor((t.pads[0]+t.pads[2])/2),D[1]-1-Math.floor((t.pads[1]+t.pads[3])/2)],N=[{type:12,data:v},{type:12,data:S},{type:12,data:x},{type:12,data:z},{type:12,data:D},{type:6,data:M},{type:12,data:h},{type:12,data:u},{type:12,data:l},...E(e[0].dims,e[1].dims)];i&&(N.push(...E(e[2].dims)),w.push("rank")),N.push(...E(a));let W=Q=>{let de=[{name:"output_size",type:"u32"},{name:"strides",type:"u32",length:S.length},{name:"filter_dims",type:"u32",length:x.length},{name:"dilations",type:"u32",length:x.length},{name:"effective_filter_dims",type:"u32",length:D.length},{name:"pads",type:"i32",length:M.length},{name:"input_channels_per_group_int",type:"u32"},{name:"input_channels_per_group",type:"u32"},{name:"output_channels_per_group",type:"u32"}],te=R(e[0].dataType),ue=n?1:2,Ae=n?2:3,be=n?3:1,se=O("W",e[1].dataType,e[1].dims.length,y),$e=O("Dy",e[0].dataType,e[0].dims.length,d),ae=[$e,se];i&&ae.push(O("bias",e[2].dataType,[a[be]].length,m));let fe=Z("result",e[0].dataType,a.length,m),ot=()=>{let oe="";if(p)d===4?oe+=`
        let xValue = ${$e.getByOffset("x_offset")};
        let wValue = ${se.getByOffset("w_offset")};
        dotProd = dotProd + dot(xValue, wValue);
        x_offset += 1u;
        w_offset += 1u;`:d===2?oe+=`
          dotProd = dotProd + dot(vec4<${te}>(${$e.getByOffset("x_offset")}, ${$e.getByOffset("x_offset + 1u")}), vec4<${te}>(${se.getByOffset("w_offset")}, ${se.getByOffset("w_offset + 1u")}));
          x_offset += 2u;
          w_offset += 2u;`:d===1&&(oe+=`
          dotProd = dotProd + dot(vec4<${te}>(${$e.getByOffset("x_offset")}, ${$e.getByOffset("x_offset + 1u")}, ${$e.getByOffset("x_offset + 2u")}, ${$e.getByOffset("x_offset + 3u")}), vec4<${te}>(${se.getByOffset("w_offset")}, ${se.getByOffset("w_offset + 1u")}, ${se.getByOffset("w_offset + 2u")}, ${se.getByOffset("w_offset + 3u")}));
          x_offset += 4u;
          w_offset += 4u;`);else if(oe+=`
                  let xValue = ${n?$e.getByOffset(`${$e.indicesToOffset(`${$e.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${d}`):$e.get("batch","inputChannel","idyR","idyC")};
        `,d===1)oe+=`
          let w_offset = ${se.indicesToOffset(`${se.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel, wOutChannel)`)};
          let wValue = ${se.getByOffset(`w_offset / ${y}`)};
          dotProd = dotProd + xValue * wValue;`;else for(let xe=0;xe<d;xe++)oe+=`
            let wValue${xe} = ${se.getByOffset(`${se.indicesToOffset(`${se.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel + ${xe}, wOutChannel)`)} / ${y}`)};
            dotProd = dotProd + xValue[${xe}] * wValue${xe};`;return oe},q=()=>{if(f===0)return"";if(!p)throw new Error(`packInputAs4 ${p} is not true.`);let oe="";if(d===1){oe+="dotProd = dotProd";for(let xe=0;xe<f;xe++)oe+=`
            + ${$e.getByOffset(`x_offset + ${xe}`)} * ${se.getByOffset(`w_offset + ${xe}`)}`;oe+=";"}else if(d===2){if(f!==2)throw new Error(`Invalid inputChannelsRemainder ${f}.`);oe+=`
          let xValue = ${$e.getByOffset("x_offset")};
          let wValue = ${se.getByOffset("w_offset")};
          dotProd = dotProd + dot(xValue, wValue);`}return oe},Y=`
            let outputIndices = ${fe.offsetToIndices(`global_idx * ${m}`)};
            let batch = ${fe.indicesGet("outputIndices",0)};
            let d1 = ${fe.indicesGet("outputIndices",be)};
            let r = ${fe.indicesGet("outputIndices",ue)};
            let c = ${fe.indicesGet("outputIndices",Ae)};
            let dyCorner = vec2<i32>(i32(r), i32(c)) - uniforms.pads;
            let dyRCorner = dyCorner.x;
            let dyCCorner = dyCorner.y;
            let groupId = d1 / uniforms.output_channels_per_group;
            let wOutChannel = d1 - groupId * uniforms.output_channels_per_group;
            // Convolve dy(?, ?, d2) with w(:, :, d1, d2) to compute dx(xR, xC, d1).
            // ? = to be determined. : = across all values in that axis.
            var dotProd = ${fe.type.value}(0.0);
            var wR: u32 = 0;
            if (uniforms.dilations.x == 1) {
              // Minimum wR >= 0 that satisfies (dyRCorner + wR) % (uniforms.strides.x) == 0
              wR = u32(((dyRCorner + i32(uniforms.strides.x) - 1) / i32(uniforms.strides.x)) * i32(uniforms.strides.x) - dyRCorner);
            }
            for (; wR < uniforms.effective_filter_dims.x; wR = wR + 1) {
              if (wR % uniforms.dilations.x != 0) {
                continue;
              }
              let dyR = (${te}(dyRCorner) + ${te}(wR)) / ${te}(uniforms.strides[0]);
              let wRPerm = uniforms.filter_dims.x - 1 - wR / uniforms.dilations.x;
              if (dyR < 0.0 || dyR >= ${te}(uniforms.Dy_shape[${ue}]) || fract(dyR) > 0.0 ||
                  wRPerm < 0) {
                continue;
              }
              let idyR: u32 = u32(dyR);
              var wC: u32 = 0;
              if (uniforms.dilations.y == 1) {
                // Minimum wC >= 0 that satisfies (dyCCorner + wC) % (uniforms.strides.y) == 0
                wC = u32(((dyCCorner + i32(uniforms.strides.y) - 1) / i32(uniforms.strides.y)) * i32(uniforms.strides.y) - dyCCorner);
              }
              for (; wC < uniforms.effective_filter_dims.y; wC = wC + 1) {
                if (wC % uniforms.dilations.y != 0) {
                  continue;
                }
                let dyC = (${te}(dyCCorner) + ${te}(wC)) / ${te}(uniforms.strides.y);
                let wCPerm = uniforms.filter_dims.y - 1 - wC / uniforms.dilations.y;
                if (dyC < 0.0 || dyC >= ${te}(uniforms.Dy_shape[${Ae}]) ||
                    fract(dyC) > 0.0 || wCPerm < 0) {
                  continue;
                }
                let idyC: u32 = u32(dyC);
                var inputChannel = groupId * uniforms.input_channels_per_group;
                ${p?`
                var x_offset = ${$e.indicesToOffset(`${$e.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${d};
                var w_offset = ${se.indicesToOffset(`${se.type.indices}(wRPerm, wCPerm, inputChannel, wOutChannel)`)} / ${y};
                  `:""}
                for (var d2: u32 = 0; d2 < uniforms.input_channels_per_group_int; d2 = d2 + ${p?4:d}) {
                  ${ot()}
                  inputChannel = inputChannel + ${p?4:d};
                }
                ${q()}
                wC = wC + uniforms.strides.y - 1;
              }
              wR = wR + uniforms.strides[0] - 1;
            }
            let value = dotProd${i?` + bias[d1 / ${m}]`:""};
            ${fe.setByOffset("global_idx","value")};
          `;return`
    ${Q.registerUniforms(de).declareVariables(...ae,fe)}
      ${Q.mainStart()}
      ${Q.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")};
    ${Y}}`};return{name:"ConvTranspose2D",shaderCache:{hint:`${t.cacheKey};${d}${y}${m}${p}${f}`,inputDependencies:w},getRunData:()=>({dispatchGroup:{x:_[0],y:_[1],z:_[2]},outputs:[{dims:r?r(a):a,dataType:e[0].dataType}],programUniforms:N}),getShaderSource:W}}}),Ou,Ru,Bu,Mn,Mu,Du,Dn,Pu,Uu,Pc=C(()=>{Dc(),Xr(),at(),Ou=(e,t,r,i,a,n)=>(e-1)*t+r+(i-1)*a+1-n,Ru=(e,t,r,i,a)=>{let n=Math.floor(e/2);t==="SAME_UPPER"?(r[i]=n,r[a]=e-n):t==="SAME_LOWER"&&(r[i]=e-n,r[a]=n)},Bu=(e,t,r,i,a,n,s,o,u,l)=>{let d=e.length-2,p=l.length===0;u.length<d&&u.push(...Array(d-u.length).fill(0));let h=e[0],f=t[o?3:1]*a;for(let m=0,y=e.length-d-(o?1:0);m<d;++m,++y){let v=e[y],_=p?v*s[m]:l[m],w=Ou(v,s[m],n[m],t[y],r[m],_);Ru(w,i,n,m,m+d),p&&l.push(s[m]*(v-1)+u[m]+(t[y]-1)*r[m]+1-n[m]-n[m+d])}l.splice(0,0,h),l.splice(o?3:1,0,f)},Mn=(e,t)=>{let r=e.kernelShape.slice();if(e.kernelShape.length===0||e.kernelShape.reduce((p,h)=>p*h,1)===0){r.length=0;for(let p=2;p<t[1].dims.length;++p)r.push(t[1].dims[p])}let i=e.format==="NHWC";r.splice(0,0,t[1].dims[0]),r.splice(i?3:1,0,t[1].dims[1]);let a=e.pads.slice(),n=e.outputShape.slice(),s=e.outputPadding.slice(),o=t[0].dims,u=e.dilations.slice();if(u.reduce((p,h)=>p+h,0)===0){let p=t[0].dims.length-2;u=new Array(p).fill(1)}let l=e.strides.slice();if(l.reduce((p,h)=>p+h,0)===0){let p=t[0].dims.length-2;l=new Array(p).fill(1)}Bu(o,r,u,e.autoPad,e.group,a,l,i,s,n);let d=Object.assign({},e);return Object.assign(d,{kernelShape:r,pads:a,outputPadding:s,outputShape:n,dilations:u,strides:l}),d},Mu=e=>{let t=$n(e),r=e.format,i=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][typeof e.autoPad>"u"?0:e.autoPad],a=e.dilations,n=e.group,s=e.kernelShape,o=e.pads,u=e.strides,l=e.wIsConst(),d=e.outputPadding,p=e.outputShape;return{autoPad:i,format:r,dilations:a,group:n,kernelShape:s,outputPadding:d,outputShape:p,pads:o,strides:u,wIsConst:l,...t,cacheKey:`${e.format};${t.activation};`}},Du=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length!==4&&e[0].dims.length!==3)throw new Error("currently only support 2-dimensional conv");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let r=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],i=e[1].dims[0];if(r!==i)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");let a=e[1].dims[1]*t.group;if(e.length===3&&(e[2].dims.length!==1||e[2].dims[0]!==a))throw new Error("invalid bias");let n=e[0].dims.length-2;if(t.dilations.reduce((s,o)=>s+o,0)>0&&t.dilations.length!==n)throw new Error(`dilations should be ${n}D`);if(t.strides.reduce((s,o)=>s+o,0)>0&&t.strides.length!==n)throw new Error(`strides should be ${n}D`);if(t.pads.reduce((s,o)=>s+o,0)>0&&t.pads.length!==n*2)throw new Error(`pads should be ${n*2}D`);if(t.outputPadding.length!==n&&t.outputPadding.length!==0)throw new Error(`output_padding should be ${n}D`);if(t.kernelShape.reduce((s,o)=>s+o,0)>0&&t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape");if(t.outputShape.length!==0&&t.outputShape.length!==e[0].dims.length-2)throw new Error("invalid output shape")},Dn=(e,t,r,i)=>{let a=e.kernelCustomData.wT??e.compute(ct(t[1],[2,3,0,1]),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=a);let n=[t[0],a];t.length===3&&n.push(t[2]),e.compute(zu(n,r,i),{inputs:n})},Pu=(e,t)=>{let r=t.format==="NHWC",i=[e.inputs[0].reshape(r?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&i.push(e.inputs[2]);let a=t.kernelShape;(a.length===0||a[0]===0)&&(a=[e.inputs[1].dims[2]]);let n=t.dilations;(n.length===0||n[0]===0)&&(n=[1]);let s=t.strides;(s.length===0||s[0]===0)&&(s=[1]);let o=t.pads;o.length===0&&(o=[0,0]),o=[0,o[0],0,o[1]],s=[1].concat(s),n=[1].concat(n),a=[1].concat(a);let u=t.outputPadding;u=[0].concat(u);let l=Mn({...t,pads:o,strides:s,dilations:n,kernelShape:a,outputPadding:u},i);Dn(e,i,l,d=>r?[d[0],d[2],d[3]]:[d[0],d[1],d[3]])},Uu=(e,t)=>{if(Du(e.inputs,t),e.inputs[0].dims.length===3)Pu(e,t);else{let r=Mn(t,e.inputs);Dn(e,e.inputs,r)}}}),Nu,Lu,Vu,Uc=C(()=>{pe(),ne(),b(),ie(),Nu=(e,t,r,i)=>{let a=U.size(t),n=t.length,s=O("input",e,n),o=Z("output",e,n),u=r.dataType===6?r.getInt32Array()[0]:Number(r.getBigInt64Array()[0]),l=U.normalizeAxis(u,n),d=p=>{let h=` i32(${s.indicesGet("inputIndices","uniforms.axis")}) `,f=P("uniforms.input_shape","uniforms.axis",n),m=i.reverse?h+(i.exclusive?" + 1":""):"0",y=i.reverse?f:h+(i.exclusive?"":" + 1");return`
                ${p.registerUniform("outputSize","u32").registerUniform("axis","u32").declareVariables(s,o)}
                ${p.mainStart()}
                  ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
                  var inputIndices = ${o.offsetToIndices("global_idx")};
                  var sum = ${o.type.value}(0);
                  let first : i32 = ${m};
                  let last : i32 = ${y};
                  for (var i : i32 = first; i < last; i++) {
                    ${s.indicesSet("inputIndices","uniforms.axis","u32(i)")};
                    sum = sum + ${s.getByIndices("inputIndices")};
                  }
                  ${o.setByOffset("global_idx","sum")};
                }`};return{name:"CumSum",shaderCache:{hint:i.cacheKey,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:t,dataType:e}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:[{type:12,data:a},{type:12,data:l},...E(t,t)]}),getShaderSource:d}},Lu=(e,t)=>{let r=e.inputs[0].dims,i=e.inputs[0].dataType,a=e.inputs[1];e.compute(Nu(i,r,a,t),{inputs:[0]})},Vu=e=>{let t=e.exclusive===1,r=e.reverse===1;return g({exclusive:t,reverse:r})}}),Wu,Fu,qu,Gu,Hu,Nc=C(()=>{pe(),ne(),b(),ie(),Wu=e=>{if(!e||e.length!==1)throw new Error("DepthToSpace requires 1 input.");if(e[0].dims.length!==4)throw new Error("DepthToSpace requires 4D input.")},Fu=(e,t,r,i)=>{let a=[];a.push(`fn perm(i: ${i.type.indices}) -> ${r.type.indices} {
    var a: ${r.type.indices};`);for(let n=0;n<t;++n)a.push(r.indicesSet("a",e[n],`i[${n}]`));return a.push("return a;}"),a.join(`
`)},qu=(e,t)=>{let r,i,a,n,s,o,u=t.format==="NHWC",l=t.blocksize,d=t.mode==="DCR";u?([r,i,a,n]=e.dims,s=d?[r,i,a,l,l,n/l**2]:[r,i,a,n/l**2,l,l],o=d?[0,1,3,2,4,5]:[0,1,4,2,5,3]):([r,i,a,n]=[e.dims[0],e.dims[2],e.dims[3],e.dims[1]],s=d?[r,l,l,n/l**2,i,a]:[r,n/l**2,l,l,i,a],o=d?[0,3,4,1,5,2]:[0,1,4,2,5,3]);let p=e.reshape(s),h=p.dims.length,f=e.dataType,m=O("a",f,h),y=Z("output",f,h),v=_=>`
  ${_.registerUniform("output_size","u32").declareVariables(m,y)}

  ${Fu(o,h,m,y)}

  ${_.mainStart()}
    ${_.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${y.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${y.setByOffset("global_idx",m.getByIndices("aIndices"))}
  }`;return{name:"DepthToSpace",shaderCache:{hint:`${e.dims};${t.blocksize};${t.mode}`,inputDependencies:["rank"]},getRunData:_=>{let w=u?[r,i*l,a*l,n/l**2]:[r,n/l**2,i*l,a*l],S=U.size(w),x=p.dims,z=U.sortBasedOnPerm(x,o);return{outputs:[{dims:w,dataType:_[0].dataType}],dispatchGroup:{x:Math.ceil(S/64)},programUniforms:[{type:12,data:S},...E(x,z)]}},getShaderSource:v}},Gu=(e,t)=>{Wu(e.inputs),e.compute(qu(e.inputs[0],t))},Hu=e=>g({blocksize:e.blocksize,mode:e.mode,format:e.format})}),Va,ha,Pn,ju,Ku,Zu,Qu,Un,Xu,Yu,Ju,Lc=C(()=>{pe(),ne(),b(),ie(),Va="[a-zA-Z]|\\.\\.\\.",ha="("+Va+")+",Pn="^"+ha+"$",ju="("+ha+",)*"+ha,Ku="^"+ju+"$",Zu=class{constructor(e=-1){this.symbolToIndices=new Map,this.inputIndex=e}addSymbol(e,t){let r=this.symbolToIndices.get(e);r===void 0?r=[t]:r.push(t),this.symbolToIndices.set(e,r)}},Qu=class{constructor(e,t){var a;this.equation=t,this.hasEllipsis=!1,this.symbolToInfo=new Map,this.lhs=new Array,this.outputDims=[];let[r,i]=t.includes("->")?t.split("->",2):[t,""];if(!r.match(RegExp(Ku)))throw new Error("Invalid LHS term");if(r.split(",").forEach((n,s)=>{let o=e[s].dims.slice();if(!n.match(RegExp(Pn)))throw new Error("Invalid LHS term");let u=this.processTerm(n,!0,o,s);this.lhs.push(u)}),i==="")i+=[...this.symbolToInfo.entries()].filter(([n,s])=>s.count===1||n==="...").map(([n])=>n).join("");else if(!i.match(RegExp(ha)))throw new Error("Invalid RHS");(a=i.match(RegExp(Va,"g")))==null||a.forEach(n=>{if(n==="...")this.outputDims=this.outputDims.concat(this.ellipsisDims);else{let s=this.symbolToInfo.get(n);if(s===void 0)throw new Error("Invalid RHS symbol");this.outputDims.push(s.dimValue)}}),this.rhs=this.processTerm(i,!1,this.outputDims)}addSymbol(e,t,r){let i=this.symbolToInfo.get(e);if(i!==void 0){if(i.dimValue!==t&&i.count!==1)throw new Error("Dimension mismatch");i.count++,i.inputIndices.push(r)}else i={count:1,dimValue:t,inputIndices:[r]};this.symbolToInfo.set(e,i)}processTerm(e,t,r,i=-1){let a=r.length,n=!1,s=[],o=0;if(!e.match(RegExp(Pn))&&!t&&e!=="")throw new Error("Invalid LHS term");let u=e.match(RegExp(Va,"g")),l=new Zu(i);return u==null||u.forEach((d,p)=>{if(d==="..."){if(n)throw new Error("Only one ellipsis is allowed per input term");n=!0;let h=a-u.length+1;if(h<0)throw new Error("Ellipsis out of bounds");if(s=r.slice(o,o+h),this.hasEllipsis){if(this.ellipsisDims.length!==s.length||this.ellipsisDims.toString()!==s.toString())throw new Error("Ellipsis dimensions mismatch")}else if(t)this.hasEllipsis=!0,this.ellipsisDims=s;else throw new Error("Ellipsis must be specified in the LHS");for(let f=0;f<s.length;f++){let m=String.fromCharCode(48+f);l.addSymbol(m,p+f),this.addSymbol(m,r[o++],i)}}else l.addSymbol(d,p+(this.hasEllipsis?this.ellipsisDims.length-1:0)),this.addSymbol(d,r[o++],i)}),l}},Un=e=>e+"_max",Xu=(e,t,r,i)=>{let a=e.map(l=>l.length).map((l,d)=>O(`input${d}`,t,l)),n=U.size(i),s=Z("output",t,i.length),o=[...r.symbolToInfo.keys()].filter(l=>!r.rhs.symbolToIndices.has(l)),u=l=>{let d=[],p="var prod = 1.0;",h="var sum = 0.0;",f="sum += prod;",m=[],y=[],v=[],_=[],w=r.symbolToInfo.size===r.rhs.symbolToIndices.size;r.symbolToInfo.forEach((x,z)=>{var D;if(r.rhs.symbolToIndices.has(z)){let M=(D=r.rhs.symbolToIndices.get(z))==null?void 0:D[0];M!==void 0&&r.lhs.forEach((N,W)=>{if(x.inputIndices.includes(W)){let Q=N.symbolToIndices.get(z);if(Q===void 0)throw new Error("Invalid symbol error");Q.forEach(de=>{d.push(`${a[W].indicesSet(`input${W}Indices`,de,s.indicesGet("outputIndices",M))}`)})}})}else r.lhs.forEach((M,N)=>{if(x.inputIndices.includes(N)){let W=M.symbolToIndices.get(z);if(W===void 0)throw new Error("Invalid symbol error");W.forEach(Q=>{m.push(`${a[N].indicesSet(`input${N}Indices`,Q,`${z}`)}`)}),_.push(`prod *= ${a[N].getByIndices(`input${N}Indices`)};`)}}),y.push(`for(var ${z}: u32 = 0; ${z} < uniforms.${Un(z)}; ${z}++) {`),v.push("}")});let S=w?[...d,`let sum = ${a.map((x,z)=>x.getByIndices(`input${z}Indices`)).join(" * ")};`]:[...d,h,...y,...m,p,..._,f,...v];return`
            ${l.registerUniforms(o.map(x=>({name:`${Un(x)}`,type:"u32"}))).registerUniform("outputSize","u32").declareVariables(...a,s)}

            ${l.mainStart()}
            ${l.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
            var outputIndices = ${s.offsetToIndices("global_idx")};
            ${a.map((x,z)=>`var input${z}Indices: ${a[z].type.indices};`).join(`
`)}
            ${S.join(`
`)};
            ${s.setByOffset("global_idx","sum")};
          }`};return{name:"Einsum",shaderCache:{hint:r.equation,inputDependencies:e.map(()=>"rank")},getRunData:()=>{let l=o.filter(p=>r.symbolToInfo.has(p)).map(p=>{var h;return{type:12,data:((h=r.symbolToInfo.get(p))==null?void 0:h.dimValue)||0}});l.push({type:12,data:n});let d=e.map((p,h)=>[...E(p)]).reduce((p,h)=>p.concat(h),l);return d.push(...E(i)),{outputs:[{dims:i,dataType:t}],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:d}},getShaderSource:u}},Yu=(e,t)=>{let r=new Qu(e.inputs,t.equation),i=r.outputDims,a=e.inputs.map((n,s)=>n.dims);e.compute(Xu(a,e.inputs[0].dataType,r,i))},Ju=e=>{let t=e.equation.replace(/\s+/g,"");return g({equation:t})}}),el,Nn,tl,rl,il,Vc=C(()=>{pe(),ne(),ie(),el=e=>{if(!e||e.length!==2)throw new Error("Expand requires 2 input.");let t=e[0].dims,r=Array.from(e[1].getBigInt64Array(),Number),i=r.length<t.length?0:r.length-t.length,a=t.length<r.length?0:t.length-r.length;for(;i<r.length&&a<t.length;++i,++a)if(r[i]!==t[a]&&r[i]!==1&&t[a]!==1)throw new Error("Expand requires shape to be broadcastable to input")},Nn=(e,t)=>{let r=e.length-t.length,i=[];for(let a=0;a<r;++a)i.push(e[a]);for(let a=0;a<t.length;++a)i.push(t[a]===1?e[a+r]:t[a]);return i},tl=(e,t)=>e.length>t.length?Nn(e,t):Nn(t,e),rl=e=>{let t=e[0].dims,r=Array.from(e[1].getBigInt64Array(),Number),i=tl(t,r),a=e[0].dataType,n=a===9||U.size(t)===1,s=a===9||t.length>0&&t[t.length-1]%4===0?4:1,o=n||i.length>0&&i[i.length-1]%4===0?4:1,u=Math.ceil(U.size(i)/o),l=p=>{let h=O("input",a,t.length,s),f=Z("output",a,i.length,o),m;if(a===9){let y=(v,_,w="")=>`
          let outputIndices${_} = ${f.offsetToIndices(`outputOffset + ${_}u`)};
          let offset${_} = ${h.broadcastedIndicesToOffset(`outputIndices${_}`,f)};
          let index${_} = offset${_} / 4u;
          let component${_} = offset${_} % 4u;
          ${v}[${_}] = ${w}(${h.getByOffset(`index${_}`)}[component${_}]);
        `;m=`
        let outputOffset = global_idx * ${o};
        var data = vec4<u32>(0);
        ${y("data",0,"u32")}
        ${y("data",1,"u32")}
        ${y("data",2,"u32")}
        ${y("data",3,"u32")}
        ${f.setByOffset("global_idx","data")}
      }`}else m=`
        let outputIndices = ${f.offsetToIndices(`global_idx * ${o}`)};
        let inputOffset = ${h.broadcastedIndicesToOffset("outputIndices",f)};
        let data = ${f.type.value}(${h.getByOffset(`inputOffset / ${s}`)});
        ${f.setByOffset("global_idx","data")}
      }`;return`
    ${p.registerUniform("vec_size","u32").declareVariables(h,f)}
    ${p.mainStart()}
    ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
    ${m}`},d=[{type:12,data:u},...E(t,i)];return{name:"Expand",shaderCache:{hint:`${i.length};${s}${o}`,inputDependencies:["rank"]},getShaderSource:l,getRunData:()=>({outputs:[{dims:i,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:d})}},il=e=>{el(e.inputs),e.compute(rl(e.inputs),{inputs:[0]})}}),al,nl,Wc=C(()=>{pe(),ne(),ie(),vn(),al=e=>{let t=e[0].dataType,r=U.size(e[0].dims),i=U.size(e[1].dims),a=i%4===0,n=s=>{let o=O("x",t,[1],4),u=O("bias",t,[1],4),l=Z("y",t,[1],4),d=[{name:"output_vec_size",type:"u32"},{name:"bias_size",type:"u32"}],p=f=>`
      let bias${f}_offset: u32 = (global_idx * 4 + ${f}) % uniforms.bias_size;
      let bias${f} = ${u.getByOffset(`bias${f}_offset / 4`)}[bias${f}_offset % 4];`,h=a?`
      let bias = ${u.getByOffset("global_idx % (uniforms.bias_size / 4)")};`:`${p(0)}${p(1)}${p(2)}${p(3)}
      let bias = ${o.type.value}(bias0, bias1, bias2, bias3);`;return`${s.registerUniforms(d).declareVariables(o,u,l)}

    ${_n(I(t))}

    ${s.mainStart(T)}
      ${s.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_vec_size")}

      let x = ${o.getByOffset("global_idx")};
      ${h}
      let x_in = x + bias;
      ${l.setByOffset("global_idx",bn("x_in"))}
    }`};return{name:"FastGeluWithBias",shaderCache:{hint:`${a}`,inputDependencies:["type","type"]},getShaderSource:n,getRunData:s=>({outputs:[{dims:s[0].dims,dataType:s[0].dataType}],programUniforms:[{type:12,data:Math.ceil(r/4)},{type:12,data:i}],dispatchGroup:{x:Math.ceil(r/T/4)}})}},nl=e=>{e.inputs.length<2||U.size(e.inputs[1].dims)===0?No(e):e.compute(al(e.inputs))}}),sl,ol,ul,ll,Fc=C(()=>{pe(),ne(),b(),ie(),sl=e=>{if(!e||e.length!==2)throw new Error("Gather requires 2 inputs.")},ol=(e,t)=>{let r=e[0].dims,i=e[1].dims,a=r.length,n=U.normalizeAxis(t.axis,a),s=r.slice(0);s.splice(n,1,...i);let o=r[n],u=e[0].dataType===9?4:1,l=Math.ceil(U.size(s)/u),d=[{type:12,data:l},{type:6,data:o},{type:12,data:n},...E(e[0].dims,e[1].dims,s)],p=h=>{let f=O("data",e[0].dataType,e[0].dims.length,u),m=O("inputIndices",e[1].dataType,e[1].dims.length),y=Z("output",e[0].dataType,s.length,u),v=w=>{let S=i.length,x=`var indicesIndices${w}  = ${m.type.indices}(0);`;for(let z=0;z<S;z++)x+=`${S>1?`indicesIndices${w}[${z}]`:`indicesIndices${w}`} = ${s.length>1?`outputIndices${w}[uniforms.axis + ${z}]`:`outputIndices${w}`};`;x+=`
          var idx${w} = ${m.getByIndices(`indicesIndices${w}`)};
          if (idx${w} < 0) {
            idx${w} = idx${w} + uniforms.axisDimLimit;
          }
          var dataIndices${w} : ${f.type.indices};
        `;for(let z=0,D=0;z<a;z++)z===n?(x+=`${a>1?`dataIndices${w}[${z}]`:`dataIndices${w}`} = u32(idx${w});`,D+=S):(x+=`${a>1?`dataIndices${w}[${z}]`:`dataIndices${w}`} = ${s.length>1?`outputIndices${w}[${D}]`:`outputIndices${w}`};`,D++);return x},_;if(e[0].dataType===9){let w=(S,x,z="")=>`
          let outputIndices${x} = ${y.offsetToIndices(`outputOffset + ${x}u`)};
          ${v(x)};
          let offset${x} = ${f.indicesToOffset(`dataIndices${x}`)};
          let index${x} = offset${x} / 4u;
          let component${x} = offset${x} % 4u;
          ${S}[${x}] = ${z}(${f.getByOffset(`index${x}`)}[component${x}]);
        `;_=`
        let outputOffset = global_idx * ${u};
        var value = vec4<u32>(0);
        ${w("value",0,"u32")}
        ${w("value",1,"u32")}
        ${w("value",2,"u32")}
        ${w("value",3,"u32")}
        ${y.setByOffset("global_idx","value")}
      `}else _=`
      let outputIndices = ${y.offsetToIndices("global_idx")};
      ${v("")};
      let value = ${f.getByIndices("dataIndices")};
      ${y.setByOffset("global_idx","value")};
      `;return`
      ${h.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(f,m,y)}
      ${h.mainStart()}
        ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        ${_}
      }`};return{name:"Gather",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:s,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:d}),getShaderSource:p}},ul=e=>g({axis:e.axis}),ll=(e,t)=>{let r=e.inputs;sl(r),e.compute(ol(e.inputs,t))}}),dl,pl,cl,qc=C(()=>{pe(),ne(),ie(),dl=(e,t,r,i,a,n,s,o,u)=>{let l=[{type:12,data:n},{type:12,data:i},{type:12,data:a},{type:12,data:r},{type:12,data:s},{type:12,data:o},{type:12,data:u}],d=[n];l.push(...E(t.dims,d));let p=h=>{let f=O("indices_data",t.dataType,t.dims.length),m=Z("input_slice_offsets_data",12,1,1),y=[f,m],v=[{name:"output_size",type:"u32"},{name:"batch_dims",type:"u32"},{name:"input_dims",type:"u32",length:a.length},{name:"sizes_from_slice_dims_data",type:"u32",length:r.length},{name:"num_slices_per_batch",type:"u32"},{name:"input_batch_stride",type:"u32"},{name:"num_slice_dims",type:"u32"}];return`
  ${h.registerUniforms(v).declareVariables(...y)}
  ${h.mainStart()}
    ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let batch_idx = global_idx / uniforms.num_slices_per_batch;
    let base_offset = batch_idx * uniforms.input_batch_stride;

    let slice_indices_base_offset = global_idx * uniforms.num_slice_dims;
    var relative_slice_offset = 0;
    for (var dim_idx = 0u; dim_idx < uniforms.num_slice_dims; dim_idx ++) {
      var index = i32(indices_data[dim_idx + slice_indices_base_offset].x);
      let input_dim_idx = uniforms.batch_dims + dim_idx;
      if (index < 0) {
        ${a.length===1?"index += i32(uniforms.input_dims);":"index += i32(uniforms.input_dims[input_dim_idx]);"}
      }
      ${r.length===1?"relative_slice_offset += index * i32(uniforms.sizes_from_slice_dims_data);":"relative_slice_offset += index * i32(uniforms.sizes_from_slice_dims_data[dim_idx]);"}
    }

    input_slice_offsets_data[global_idx] =  base_offset + u32(relative_slice_offset);
  }`};return e.compute({name:"computeSliceOffsets",shaderCache:{hint:`${a.length}_${r.length}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:d,dataType:e.inputs[1].dataType}],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:l}),getShaderSource:p},{inputs:[t],outputs:[-1]})[0]},pl=(e,t)=>{let r=e.inputs,i=r[0].dims,a=r[0].dataType,n=r[1].dims,s=n[n.length-1],o=U.sizeToDimension(n,n.length-1),u=U.sizeFromDimension(i,t.batchDims+s),l=U.sizeToDimension(i,t.batchDims),d=U.sizeFromDimension(i,t.batchDims),p=o/l,h=new Array(s),f=u;for(let x=0;x<s;++x)h[s-1-x]=f,f*=i[t.batchDims+s-1-x];let m=dl(e,r[1],h,t.batchDims,i,o,p,d,s),y=t.batchDims+s;if(y>i.length)throw new Error("last dimension of indices must not be larger than rank of input tensor");let v=n.slice(0,-1).concat(i.slice(y)),_=U.size(v),w=[{type:12,data:_},{type:12,data:u},...E(r[0].dims,m.dims,v)],S=x=>{let z=O("data",r[0].dataType,r[0].dims.length),D=O("slice_offsets",12,m.dims.length),M=Z("output",r[0].dataType,v.length);return`
          ${x.registerUniform("output_size","u32").registerUniform("slice_size","u32").declareVariables(z,D,M)}
            ${x.mainStart()}
            ${x.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let slice_offset = slice_offsets[global_idx / uniforms.slice_size];
          output[global_idx] = data[u32(slice_offset) + global_idx % uniforms.slice_size];
        }`};e.compute({name:"GatherND",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:v,dataType:a}],dispatchGroup:{x:Math.ceil(_/64)},programUniforms:w}),getShaderSource:S},{inputs:[r[0],m]})},cl=e=>({batchDims:e.batch_dims,cacheKey:""})}),hl,fl,ml,gl,Gc=C(()=>{pe(),ne(),b(),ie(),hl=(e,t)=>{if(e.length<3||e.length>4)throw new Error("GatherBlockQuantized requires 3 or 4 inputs.");let r=U.normalizeAxis(t.quantizeAxis,e[0].dims.length),i=t.blockSize,a=e[0],n=e[2],s=e.length===4?e[3]:void 0;if(n.dims.length!==a.dims.length||!a.dims.map((o,u)=>u===r?Math.ceil(o/i)===n.dims[u]:o===n.dims[u]).reduce((o,u)=>o&&u,!0))throw new Error("Scales must have the same rank as the input tensor and the dims should match except on gatherAxis.");if(s){if(s.dataType!==a.dataType)throw new Error("Zero point must have the same data type as the input tensor.");if(s.dims.length!==n.dims.length||!s.dims.map((o,u)=>o===n.dims[u]).reduce((o,u)=>o&&u,!0))throw new Error("Zero point must have the same rank as the input tensor and the dims should match except on quantizeAxis.")}},fl=(e,t)=>{let r=e[0].dims,i=e[1].dims,a=r.length,n=U.normalizeAxis(t.gatherAxis,a),s=U.normalizeAxis(t.quantizeAxis,a),o=r.slice(0);o.splice(n,1,...i);let u=U.size(o),l=e[2].dataType,d=e[0].dataType===22,p=[{type:12,data:u},{type:12,data:s},{type:12,data:n},{type:12,data:t.blockSize},...E(...e.map((f,m)=>f.dims),o)],h=f=>{let m=O("data",e[0].dataType,e[0].dims.length),y=O("inputIndices",e[1].dataType,e[1].dims.length),v=O("scales",e[2].dataType,e[2].dims.length),_=e.length>3?O("zeroPoint",e[3].dataType,e[3].dims.length):void 0,w=Z("output",l,o.length),S=[m,y,v];_&&S.push(_);let x=[{name:"output_size",type:"u32"},{name:"quantize_axis",type:"u32"},{name:"gather_axis",type:"u32"},{name:"block_size",type:"u32"}];return`
        ${f.registerUniforms(x).declareVariables(...S,w)}
        ${f.mainStart()}
        let output_indices = ${w.offsetToIndices("global_idx")};
        var indices_indices = ${y.type.indices}(0);
        ${i.length>1?`
          for (var i: u32 = 0; i < ${i.length}; i++) {
            let index = ${w.indicesGet("output_indices","uniforms.gather_axis + i")};
            ${y.indicesSet("indices_indices","i","index")};
          }`:`indices_indices = ${w.indicesGet("output_indices","uniforms.gather_axis")};`};
        var data_indices = ${m.type.indices}(0);
        for (var i: u32 = 0; i < uniforms.gather_axis; i++) {
          let index = ${w.indicesGet("output_indices","i")};
          ${m.indicesSet("data_indices","i","index")};
        }
        var index_from_indices = ${y.getByIndices("indices_indices")};
        if (index_from_indices < 0) {
          index_from_indices += ${r[n]};
        }
        ${m.indicesSet("data_indices","uniforms.gather_axis","u32(index_from_indices)")};
        for (var i = uniforms.gather_axis + 1; i < ${o.length}; i++) {
          let index = ${w.indicesGet("output_indices",`i + ${i.length} - 1`)};
          ${m.indicesSet("data_indices","i","index")};
        }
        let data_offset = ${m.indicesToOffset("data_indices")};
        let data_index = data_offset % 8;
        // Convert 4-bit packed data to 8-bit packed data.
        let packed_4bit_quantized_data = ${m.getByOffset("data_offset / 8")};
        let packed_8bit_quantized_data = (packed_4bit_quantized_data >> (4 * (data_index % 2))) & 0x0f0f0f0f;
        let quantized_data_vec = ${d?"unpack4xI8":"unpack4xU8"}(u32(packed_8bit_quantized_data));
        let quantized_data = quantized_data_vec[data_index / 2];
        var scale_indices = data_indices;
        let quantize_axis_index = ${v.indicesGet("data_indices","uniforms.quantize_axis")} / uniforms.block_size;
        ${v.indicesSet("scale_indices","uniforms.quantize_axis","quantize_axis_index")};
        var scale = ${v.getByIndices("scale_indices")};
        ${_?`
              let zero_point_indices = scale_indices;
              let zero_point_offset = ${_.indicesToOffset("zero_point_indices")};
              let zero_point_index = zero_point_offset % 8;
              let packed_4bit_zero_points = ${_.getByOffset("zero_point_offset / 8")};
              let packed_8bit_zero_points = (packed_4bit_zero_points >> (4 * (zero_point_index % 2))) & 0x0f0f0f0f;
              let zero_point_vec = ${d?"unpack4xI8":"unpack4xU8"}(u32(packed_8bit_zero_points));
              let zero_point = zero_point_vec[zero_point_index / 2];`:"var zero_point = 0"};
        let dequantized_data = ${I(l)}(quantized_data - zero_point) * scale;
        ${w.setByOffset("global_idx","dequantized_data")};
    }`};return{name:"GatherBlockQuantized",shaderCache:{hint:`${t.cacheKey};${e.filter((f,m)=>m!==1).map(f=>f.dims.join("_")).join(";")}`,inputDependencies:Array.from({length:e.length},(f,m)=>"rank")},getRunData:()=>({outputs:[{dims:o,dataType:l}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:p}),getShaderSource:h}},ml=(e,t)=>{let r=e.inputs;hl(r,t),e.compute(fl(e.inputs,t))},gl=e=>g({blockSize:e.blockSize,gatherAxis:e.gatherAxis,quantizeAxis:e.quantizeAxis})}),yl,wl,_l,bl,Hc=C(()=>{pe(),ne(),b(),ie(),yl=e=>{if(!e||e.length!==2)throw new Error("GatherElements requires 2 inputs.");if(e[0].dims.length<1)throw new Error("GatherElements requires that the data input be rank >= 1.");if(e[0].dims.length!==e[1].dims.length)throw new Error(`GatherElements requires that the data input and
                     indices input tensors be of same rank.`)},wl=(e,t)=>{let r=e[0].dims,i=e[0].dataType,a=r.length,n=e[1].dims,s=e[1].dataType,o=U.normalizeAxis(t.axis,a),u=r[o],l=n.slice(0),d=U.size(l),p=O("input",i,a),h=O("indicesInput",s,n.length),f=Z("output",i,l.length),m=[{type:12,data:d},{type:6,data:u},{type:12,data:o}];return m.push(...E(r,n,l)),{name:"GatherElements",shaderCache:{inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:l,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:m}),getShaderSource:y=>`
      ${y.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(p,h,f)}
      ${y.mainStart()}
      ${y.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

      let outputIndices = ${f.offsetToIndices("global_idx")};

      var idx = ${h.getByOffset("global_idx")};
      if (idx < 0) {
        idx = idx + uniforms.axisDimLimit;
      }
      var inputIndices = ${p.type.indices}(outputIndices);
      ${p.indicesSet("inputIndices","uniforms.axis","u32(idx)")};
      let value = ${p.getByIndices("inputIndices")};

      ${f.setByOffset("global_idx","value")};
  }`}},_l=e=>g({axis:e.axis}),bl=(e,t)=>{let r=e.inputs;yl(r),e.compute(wl(e.inputs,t))}}),vl,$l,xl,Sl,jc=C(()=>{pe(),ne(),ie(),vl=e=>{if(!e)throw new Error("Input is missing");if(e.length<2||e.length>3)throw new Error("Invaid input number.");if(e.length===3&&e[2].dims.length>2)throw new Error("Invalid input shape of C");if(e[0].dataType!==e[1].dataType||e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("Input types are mismatched")},$l=(e,t)=>{let r=e[0].dims.slice(),i=e[1].dims.slice(),[a,n,s]=pi.getShapeOfGemmResult(r,t.transA,i,t.transB,e.length===3?e[2].dims:void 0),o=[a,n];if(!o)throw new Error("Can't use gemm on the given tensors");let u=16,l=Math.ceil(n/u),d=Math.ceil(a/u),p=!0,h=U.size(o),f=[{type:12,data:p?l:h},{type:12,data:a},{type:12,data:n},{type:12,data:s},{type:1,data:t.alpha},{type:1,data:t.beta}],m=["type","type"];e.length===3&&(f.push(...E(e[2].dims)),m.push("rank")),f.push(...E(o));let y=_=>{let w="";t.transA&&t.transB?w="value += a[k * uniforms.M + m] * b[n * uniforms.K + k];":t.transA&&!t.transB?w="value += a[k * uniforms.M + m] * b[k * uniforms.N + n];":!t.transA&&t.transB?w="value += a[m * uniforms.K + k] * b[n * uniforms.K + k];":!t.transA&&!t.transB&&(w="value += a[m * uniforms.K + k] * b[k * uniforms.N + n];");let S=t.alpha===1?"":"value *= uniforms.alpha;",x=O("a",e[0].dataType,e[0].dims),z=O("b",e[1].dataType,e[1].dims),D=x.type.value,M=null,N=[x,z];e.length===3&&(M=O("c",e[2].dataType,e[2].dims.length),N.push(M));let W=Z("output",e[0].dataType,o.length);N.push(W);let Q=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}];return`
  ${_.registerUniforms(Q).declareVariables(...N)}

  ${_.mainStart()}
    ${_.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let m = global_idx / uniforms.N;
    let n = global_idx % uniforms.N;

    var value = ${D}(0);
    for (var k: u32 = 0u; k < uniforms.K; k++) {
      ${w}
    }

    ${S}
    ${M!=null?`let cOffset = ${M.broadcastedIndicesToOffset("vec2(m, n)",W)}; value += ${D}(uniforms.beta) * ${M.getByOffset("cOffset")};`:""}
    output[global_idx] = value;
  }`},v=_=>{let w=O("a",e[0].dataType,e[0].dims),S=O("b",e[1].dataType,e[1].dims),x=null,z=[w,S];e.length===3&&(x=O("c",e[2].dataType,e[2].dims.length),z.push(x));let D=Z("output",e[0].dataType,o.length);z.push(D);let M=[{name:"num_tile_n",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}],N="",W="";t.transA&&t.transB?(W=`
      var col = tile_row_start + local_id.x;
      var row = k_start + local_id.y;
      if (col < uniforms.M && row < uniforms.K) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.M + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${w.type.value}(0);
      }

      col = k_start + local_id.x;
      row = tile_col_start + local_id.y;
      if (col < uniforms.K && row < uniforms.N) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.K + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${S.type.value}(0);
      }
      `,N="value += tile_a[k][local_id.y] * tile_b[local_id.x][k];"):t.transA&&!t.transB?(W=`
      var col = tile_row_start + local_id.x;
      var row = k_start + local_id.y;
      if (col < uniforms.M && row < uniforms.K) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.M + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${w.type.value}(0);
      }

      col = tile_col_start + local_id.x;
      row = k_start + local_id.y;
      if (col < uniforms.N && row < uniforms.K) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.N + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${S.type.value}(0);
      }
      `,N="value += tile_a[k][local_id.y] * tile_b[k][local_id.x];"):!t.transA&&t.transB?(W=`
      var col = k_start + local_id.x;
      var row = tile_row_start + local_id.y;
      if (col < uniforms.K && row < uniforms.M) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.K + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${w.type.value}(0);
      }

      col = k_start + local_id.x;
      row = tile_col_start + local_id.y;
      if (col < uniforms.K && row < uniforms.N) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.K + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${S.type.value}(0);
      }
      `,N="value += tile_a[local_id.y][k] * tile_b[local_id.x][k];"):!t.transA&&!t.transB&&(W=`
      var col = k_start + local_id.x;
      var row = tile_row_start + local_id.y;
      if (col < uniforms.K && row < uniforms.M) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.K + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${w.type.value}(0);
      }

      col = tile_col_start + local_id.x;
      row = k_start + local_id.y;
      if (col < uniforms.N && row < uniforms.K) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.N + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${S.type.value}(0);
      }
      `,N="value += tile_a[local_id.y][k] * tile_b[k][local_id.x];");let Q=t.alpha===1?"":"value *= uniforms.alpha;";return`
  ${_.registerUniforms(M).declareVariables(...z)}
  var<workgroup> tile_a: array<array<${w.type.storage}, ${u}>, ${u}>;
  var<workgroup> tile_b: array<array<${S.type.storage}, ${u}>, ${u}>;
  ${_.mainStart([u,u,1])}
    let tile_col_start = (workgroup_index % uniforms.num_tile_n) * ${u};
    let tile_row_start = (workgroup_index / uniforms.num_tile_n) * ${u};
    let num_tiles = (uniforms.K - 1) / ${u} + 1;
    var k_start = 0u;
    var value = ${D.type.value}(0);
    for (var t: u32 = 0u; t < num_tiles; t++) {
      ${W}
      k_start = k_start + ${u};
      workgroupBarrier();

      for (var k: u32 = 0u; k < ${u}; k++) {
        ${N}
      }
      workgroupBarrier();
    }

    ${Q}
    let m = tile_row_start + local_id.y;
    let n = tile_col_start + local_id.x;
    ${x!=null?`let cOffset = ${x.broadcastedIndicesToOffset("vec2(m, n)",D)}; value += ${D.type.value}(uniforms.beta) * ${x.getByOffset("cOffset")};`:""}
    if (m < uniforms.M && n < uniforms.N) {
      output[m * uniforms.N + n] = value;
    }
  }`};return p?{name:"GemmShared",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:o,dataType:e[0].dataType}],dispatchGroup:{x:l*d},programUniforms:f}),getShaderSource:v}:{name:"Gemm",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:o,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(h/64)},programUniforms:f}),getShaderSource:y}},xl=e=>{let t=e.transA,r=e.transB,i=e.alpha,a=e.beta;return{transA:t,transB:r,alpha:i,beta:a,cacheKey:`${e.transA};${e.transB};${e.alpha===1}`}},Sl=(e,t)=>{vl(e.inputs),e.compute($l(e.inputs,t))}}),Yt,nr,Yr,Jr,Tl,El,Il,kl,Cl,Al,zl,Ol,Rl,Bl,Kc=C(()=>{pe(),ne(),b(),ie(),[Yt,nr,Yr,Jr]=[0,1,2,3],Tl=e=>{if(e[0].dims.length!==4)throw new Error("only 4-D tensor is supported.");if(e[0].dims.length!==e[1].dims.length)throw new Error("input dimensions must be equal to grid dimensions");if(e[0].dims.length-2!==e[1].dims[e[1].dims.length-1])throw new Error(`last dimension of grid must be equal to ${e[0].dims.length-2}`);if(e[0].dims[0]!==e[1].dims[0])throw new Error("grid batch size must match input batch size")},El=`
  fn gs_get_cubic_coeffs(x: f32) -> vec4<f32> {
    let cubic_alpha = -0.75f;
    let x_abs = abs(x);
    var coeffs: vec4<f32>;
    coeffs[0] = (((cubic_alpha * (x_abs + 1) - 5 * cubic_alpha) * (x_abs + 1) + 8 * cubic_alpha) * (x_abs + 1) - 4 * cubic_alpha);
    coeffs[1] = (((cubic_alpha + 2) * x_abs - (cubic_alpha + 3)) * x_abs * x_abs + 1);
    coeffs[2] = (((cubic_alpha + 2) * (1 - x_abs) - (cubic_alpha + 3)) * (1 - x_abs) * (1 - x_abs) + 1);
    coeffs[3] = (((cubic_alpha * (2 - x_abs) - 5 * cubic_alpha) * (2 - x_abs) + 8 * cubic_alpha) * (2 - x_abs) - 4 * cubic_alpha);
    return coeffs;
  }
`,Il=e=>`
  fn gs_bicubic_interpolate(p: mat4x4<${e}>, x: f32, y: f32) -> ${e} {
    var v: vec4<f32>;
    var coeffs = gs_get_cubic_coeffs(x);
    for (var i = 0; i < 4; i++) {
      v[i] = coeffs[0] * p[i][0] + coeffs[1] * p[i][1] + coeffs[2] * p[i][2] + coeffs[3] * p[i][3];
    }
    coeffs = gs_get_cubic_coeffs(y);
    let pixel = ${e}(coeffs[0] * v[0] + coeffs[1] * v[1] + coeffs[2] * v[2] + coeffs[3] * v[3]);
    return pixel;
  }
`,kl=e=>`
  fn gs_denormalize(n: f32, length: i32) -> f32 {
    ${e.alignCorners===0?`
    // alignCorners: false => [-1, 1] to [-0.5, length - 0.5]
    return ((n + 1.0) * f32(length) - 1.0) / 2.0;
    `:`
    // alignCorners: true => [-1, 1] to [0, length - 1]
    return (n + 1.0) / 2.0 * (f32(length - 1));
    `}
  }
`,Cl=e=>`
  ${e.paddingMode==="reflection"?`
      fn gs_reflect(x: i32, x_min: f32, x_max: f32) -> u32 {
        var dx = 0.0;
        var fx = f32(x);
        let range = x_max - x_min;
        if (fx < x_min) {
          dx = x_min - fx;
          let n = u32(dx / range);
          let r = dx - f32(n) * range;
          if (n % 2 == 0) {
            fx = x_min + r;
          } else {
            fx = x_max - r;
          }
        } else if (fx > x_max) {
          dx = fx - x_max;
          let n = u32(dx / range);
          let r = dx - f32(n) * range;
          if (n % 2 == 0) {
            fx = x_max - r;
          } else {
            fx = x_min + r;
          }
        }
        return u32(fx);
      }`:""}
`,Al=(e,t,r)=>`
  fn pixel_at_grid(r: i32, c: i32, H: i32, W: i32, batch: u32, channel: u32, border: vec4<f32>) -> ${t} {
     var pixel = ${t}(0);
     var indices = vec4<u32>(0);
     indices[${Yt}] = batch;
     indices[${nr}] = channel;`+(()=>{switch(r.paddingMode){case"zeros":return`
          if (r >= 0 && r < H && c >=0 && c < W) {
            indices[${Yr}] = u32(r);
            indices[${Jr}] = u32(c);
          } else {
            return ${t}(0);
          }
        `;case"border":return`
          indices[${Yr}] = u32(clamp(r, 0, H - 1));
          indices[${Jr}] = u32(clamp(c, 0, W - 1));
        `;case"reflection":return`
          indices[${Yr}] = gs_reflect(r, border[1], border[3]);
          indices[${Jr}] = gs_reflect(c, border[0], border[2]);
        `;default:throw new Error(`padding mode ${r.paddingMode} is not supported`)}})()+`
    return ${e.getByIndices("indices")};
  }
`,zl=(e,t,r)=>(()=>{switch(r.mode){case"nearest":return`
          let result = pixel_at_grid(i32(round(y)), i32(round(x)), H_in, W_in, indices[${Yt}], indices[${nr}], border);
        `;case"bilinear":return`
          let x1 = i32(floor(x));
          let y1 = i32(floor(y));
          let x2 = x1 + 1;
          let y2 = y1 + 1;

          let p11 = pixel_at_grid(y1, x1, H_in, W_in, indices[${Yt}], indices[${nr}], border);
          let p12 = pixel_at_grid(y1, x2, H_in, W_in, indices[${Yt}], indices[${nr}], border);
          let p21 = pixel_at_grid(y2, x1, H_in, W_in, indices[${Yt}], indices[${nr}], border);
          let p22 = pixel_at_grid(y2, x2, H_in, W_in, indices[${Yt}], indices[${nr}], border);

          let dx2 = ${t}(f32(x2) - x);
          let dx1 = ${t}(x - f32(x1));
          let dy2 = ${t}(f32(y2) - y);
          let dy1 = ${t}(y - f32(y1));
          let result = dy2 * (dx2 * p11 + dx1 * p12) + dy1 * (dx2 * p21 + dx1 * p22);
        `;case"bicubic":return`
          let x0 = i32(floor(x)) - 1;
          let y0 = i32(floor(y)) - 1;
          var p: mat4x4<${t}>;
          for (var h = 0; h < 4; h++) {
            for (var w = 0; w < 4; w++) {
              p[h][w] = pixel_at_grid(h + y0, w + x0, H_in, W_in, indices[${Yt}], indices[${nr}], border);
            }
          }

          let dx = x - f32(x0 + 1);
          let dy = y - f32(y0 + 1);
          let result = gs_bicubic_interpolate(p, dx, dy);
        `;default:throw new Error(`mode ${r.mode} is not supported`)}})()+`${e.setByOffset("global_idx","result")}`,Ol=(e,t)=>{let r=O("x",e[0].dataType,e[0].dims.length),i=[e[1].dims[0],e[1].dims[1],e[1].dims[2]],a=O("grid",e[1].dataType,i.length,2),n=[e[0].dims[0],e[0].dims[1],e[1].dims[1],e[1].dims[2]];t.format==="NHWC"&&(n=[e[0].dims[0],e[1].dims[1],e[1].dims[2],e[0].dims[3]],[Yt,nr,Yr,Jr]=[0,3,1,2]);let s=Z("output",e[0].dataType,n.length),o=r.type.value,u=U.size(n),l=[{type:12,data:u},...E(e[0].dims,i,n)],d=p=>`
  ${p.registerUniform("output_size","u32").declareVariables(r,a,s)}
  ${El}
  ${Il(o)}
  ${kl(t)}
  ${Cl(t)}
  ${Al(r,o,t)}

  ${p.mainStart()}
    ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let H_in = i32(uniforms.x_shape[${Yr}]);
      let W_in = i32(uniforms.x_shape[${Jr}]);

      ${t.alignCorners===0?`
      let x_min = -0.5;
      let x_max = f32(W_in) - 0.5;
      let y_min = -0.5;
      let y_max = f32(H_in) - 0.5;
      `:`
      let x_min = 0.0;
      let x_max = f32(W_in) - 1.0;
      let y_min = 0.0;
      let y_max = f32(H_in) - 1.0;
      `};
      let border = vec4<f32>(x_min, y_min, x_max, y_max);

      let indices = ${s.offsetToIndices("global_idx")};
      var grid_indices = vec3<u32>(indices[${Yt}], indices[${Yr}], indices[${Jr}]);
      let nxy = ${a.getByIndices("grid_indices")};
      var x = gs_denormalize(f32(nxy[0]), W_in);
      var y = gs_denormalize(f32(nxy[1]), H_in);

      ${zl(s,o,t)}
  }`;return{name:"GridSample",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:["type","type"]},getRunData:p=>{let h=U.size(n);return{outputs:[{dims:n,dataType:p[0].dataType}],dispatchGroup:{x:Math.ceil(h/64)},programUniforms:l}},getShaderSource:d}},Rl=(e,t)=>{Tl(e.inputs),e.compute(Ol(e.inputs,t))},Bl=e=>g({alignCorners:e.align_corners,mode:e.mode,paddingMode:e.padding_mode,format:e.format})}),yt,Ml,Dl,Ln,Pl,fa,Ul,Nl=C(()=>{pe(),ne(),b(),mi(),yn(),ie(),at(),yt=(e,t)=>e.length>t&&e[t].dims.length>0?e[t]:void 0,Ml=(e,t)=>{let r=e[0],i=yt(e,1),a=yt(e,2),n=yt(e,3),s=yt(e,4),o=yt(e,5),u=yt(e,6),l=yt(e,7);if(r.dims.length!==3&&r.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let d=r.dims[0],p=r.dims[1],h=r.dims.length===3?r.dims[2]:t.numHeads*r.dims[4],f=p,m=0,y=0,v=Math.floor(h/t.numHeads);if(u&&l&&U.size(u.dims)&&U.size(l.dims)){if(u.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(u.dims[0]!==d||u.dims[1]!==t.numHeads||u.dims[3]!==v)throw new Error('Input "past_key" shape (batch_size, num_heads, past_sequence_length, head_size)');if(l.dims[0]!==d||l.dims[1]!==t.numHeads||l.dims[3]!==v)throw new Error('Input "past_value" shape (batch_size, num_heads, past_sequence_length, head_size)');if(u.dims[2]!==l.dims[2])throw new Error('Input "past_key" and "past_value" shall have same dim 2 (past_sequence_length)');if(l.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');m=u.dims[2],y=u.dims[2]}else if(u&&U.size(u.dims)||l&&U.size(l.dims))throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let _;if(i&&U.size(i.dims)>0){if(r.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(i.dims.length<3||i.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(r.dims[0]!==i.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(i.dims.length===3){if(i.dims[2]!==r.dims[2])throw new Error('Input "query" and "key" shall have same dim 2 (hidden_size)');_=2,f=i.dims[1]}else if(i.dims.length===5){if(i.dims[2]!==t.numHeads||i.dims[3]!==2||i.dims[4]!==v)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(a)throw new Error('Expect "value" be none when "key" has packed kv format.');_=5,f=i.dims[1]}else{if(i.dims[1]!==t.numHeads||i.dims[3]!==v)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');_=0,f=i.dims[2]}}else{if(r.dims.length!==5)throw new Error('Input "query" is expected to have 5 dimensions when key is empty');if(r.dims[2]!==t.numHeads||r.dims[3]!==3)throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');_=3}if(n&&U.size(n.dims)>0){if(n.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimension');if(i&&i.dims.length===5&&i.dims[3]===2)throw new Error("bias is not allowed for packed kv.")}let w=m+f,S=0;if(s&&U.size(s.dims)>0){S=8;let M=s.dims;throw M.length===1?M[0]===d?S=1:M[0]===3*d+2&&(S=3):M.length===2&&M[0]===d&&M[1]===w&&(S=5),S===8?new Error('Input "key_padding_mask" shape shall be (batch_size) or (batch_size, total_sequence_length)'):new Error("Mask not supported")}let x=!1,z=h;if(a&&U.size(a.dims)>0){if(a.dims.length!==3&&a.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(r.dims[0]!==a.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(a.dims.length===3){if(f!==a.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');z=a.dims[2]}else{if(f!==a.dims[2])throw new Error('Input "key" and "value" shall have the same dim 2 (kv_sequence_length)');z=a.dims[1]*a.dims[3],x=!0}}let D=!1;if(s&&U.size(s.dims)>0)throw new Error("Key padding mask is not supported");if(o&&U.size(o.dims)>0){if(o.dims.length!==4)throw new Error('Input "attention_bias" is expected to have 4 dimensions');if(o.dims[0]!==d||o.dims[1]!==t.numHeads||o.dims[2]!==p||o.dims[3]!==w)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:d,sequenceLength:p,pastSequenceLength:m,kvSequenceLength:f,totalSequenceLength:w,maxSequenceLength:y,inputHiddenSize:0,hiddenSize:h,vHiddenSize:z,headSize:v,vHeadSize:Math.floor(z/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:S,scale:t.scale,broadcastResPosBias:D,passPastInKv:x,qkvFormat:_}},Dl=e=>g({...e}),Ln=g({perm:[0,2,1,3]}),Pl=(e,t,r,i,a,n,s)=>{let o=[i,a,n],u=U.size(o),l=[{type:12,data:u},{type:12,data:s},{type:12,data:n}],d=p=>{let h=Z("qkv_with_bias",t.dataType,o),f=O("qkv",t.dataType,o),m=O("bias",r.dataType,o),y=[{name:"output_size",type:"u32"},{name:"bias_offset",type:"u32"},{name:"hidden_size",type:"u32"}];return`
  ${p.registerUniforms(y).declareVariables(f,m,h)}
  ${p.mainStart()}
    ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let bias_offset_idx = (global_idx % uniforms.hidden_size) + uniforms.bias_offset;

    qkv_with_bias[global_idx] = qkv[global_idx] + bias[bias_offset_idx];
  }`};return e.compute({name:"MultiHeadAttentionAddBias",shaderCache:{inputDependencies:["type","type"]},getRunData:()=>({outputs:[{dims:o,dataType:t.dataType,gpuDataType:0}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:l}),getShaderSource:d},{inputs:[t,r],outputs:[-1]})[0]},fa=(e,t,r,i,a,n,s,o)=>{let u=n;if(s&&U.size(s.dims)>0){if(i===1)throw new Error("AddBiasReshape is not implemented. Please export your model with packed QKV or KV");return u=Pl(e,n,s,t,i,r*a,o),u=u.reshape([t,i,r,a]),r===1||i===1?u:e.compute(ct(u,Ln.perm),{inputs:[u],outputs:[-1]})[0]}else return n.dims.length===3&&(u=n.reshape([t,i,r,a])),r===1||i===1?u:e.compute(ct(u,Ln.perm),{inputs:[u],outputs:[-1]})[0]},Ul=(e,t)=>{let r=Ml(e.inputs,t),i=e.inputs[0],a=yt(e.inputs,1),n=yt(e.inputs,2),s=yt(e.inputs,3),o=yt(e.inputs,4),u=yt(e.inputs,5),l=yt(e.inputs,6),d=yt(e.inputs,7);if(i.dims.length===5)throw new Error("Packed QKV is not implemented");if((a==null?void 0:a.dims.length)===5)throw new Error("Packed KV is not implemented");let p=a&&n&&a.dims.length===4&&n.dims.length===4,h=fa(e,r.batchSize,r.numHeads,r.sequenceLength,r.headSize,i,s,0);if(p)return la(e,h,a,n,o,void 0,l,d,u,r);if(!a||!n)throw new Error("key and value must be provided");let f=fa(e,r.batchSize,r.numHeads,r.kvSequenceLength,r.headSize,a,s,r.hiddenSize),m=fa(e,r.batchSize,r.numHeads,r.kvSequenceLength,r.vHeadSize,n,s,2*r.hiddenSize);la(e,h,f,m,o,void 0,l,d,u,r)}}),Ll,Vl,Wl,Fl,Vn,ql,Gl,Hl=C(()=>{pe(),ne(),b(),ie(),Ll=e=>{if(!e||e.length<1)throw new Error("too few inputs")},Vl=(e,t)=>{let r=[],i=t.numOutputs;return e[1].dims[0]>0&&(e[1].getBigInt64Array().forEach(a=>r.push(Number(a))),i=r.length),g({numOutputs:i,axis:t.axis,splitSizes:r})},Wl=e=>`
fn calculateOutputIndex(index: u32) -> u32 {
    for (var i: u32 = 0u; i < ${e}u; i += 1u ) {
    if (index < ${P("uniforms.size_in_split_axis","i",e)}) {
        return i;
    }
    }
    return ${e}u;
}`,Fl=e=>{let t=e.length,r=[];for(let i=0;i<t;++i){let a=e[i].setByIndices("indices","input[global_idx]");t===1?r.push(a):i===0?r.push(`if (output_number == ${i}u) { ${a} }`):i===t-1?r.push(`else { ${a} }`):r.push(`else if (output_number == ${i}) { ${a} }`)}return`
      fn writeBufferData(output_number: u32, indices: ${e[0].type.indices}, global_idx: u32) {
        ${r.join(`
`)}
      }`},Vn=(e,t)=>{let r=e[0].dims,i=U.size(r),a=e[0].dataType,n=U.normalizeAxis(t.axis,r.length),s=new Array(t.numOutputs),o=O("input",a,r.length),u=new Array(t.numOutputs),l=[],d=[],p=0,h=[{type:12,data:i}];for(let m=0;m<t.numOutputs;m++){p+=t.splitSizes[m],u[m]=p;let y=r.slice();y[n]=t.splitSizes[m],d.push(y),s[m]=Z(`output${m}`,a,y.length),l.push({dims:d[m],dataType:e[0].dataType})}h.push({type:12,data:u},...E(r,...d));let f=m=>`
  ${m.registerUniform("input_size","u32").registerUniform("size_in_split_axis","u32",u.length).declareVariables(o,...s)}
  ${Wl(u.length)}
  ${Fl(s)}

  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.input_size")}

    var indices = ${o.offsetToIndices("global_idx")};
    var index = ${o.indicesGet("indices",n)};
    let output_number = calculateOutputIndex(index);
    if (output_number != 0) {
      index -= ${P("uniforms.size_in_split_axis","output_number - 1u",u.length)};
      ${o.indicesSet("indices",n,"index")};
    }
    writeBufferData(output_number, indices, global_idx);
  }`;return{name:"Split",shaderCache:{hint:t.cacheKey,inputDependencies:["rank"]},getShaderSource:f,getRunData:()=>({outputs:l,dispatchGroup:{x:Math.ceil(i/64)},programUniforms:h})}},ql=(e,t)=>{Ll(e.inputs);let r=e.inputs.length===1?t:Vl(e.inputs,t);e.compute(Vn(e.inputs,r),{inputs:[0]})},Gl=e=>{let t=e.axis,r=e.splitSizes,i=e.numOutputs<0?r.length:e.numOutputs;if(i!==r.length)throw new Error("numOutputs and splitSizes length must be equal");return g({axis:t,numOutputs:i,splitSizes:r})}}),jl,Wa,Kl,Zl=C(()=>{pe(),ne(),b(),ie(),jl=(e,t)=>{let[r,i,a,n]=e,{numHeads:s,rotaryEmbeddingDim:o}=t;if(r.dims.length!==3&&r.dims.length!==4)throw new Error(`Input 'x' is expected to have 3 or 4 dimensions, got ${r.dims.length}`);if(!U.areEqual(i.dims,[])&&!U.areEqual(i.dims,[1])&&i.dims.length!==2)throw new Error(`Input 'position_ids' is expected to have 0, 1, or 2 dimensions, got ${i.dims.length}`);if(a.dims.length!==2)throw new Error(`Input 'cos_cache' is expected to have 2 dimensions, got ${a.dims.length}`);if(n.dims.length!==2)throw new Error(`Input 'sin_cache' is expected to have 2 dimensions, got ${n.dims.length}`);if(!U.areEqual(a.dims,n.dims))throw new Error("Inputs 'cos_cache' and 'sin_cache' are expected to have the same shape");if(o>0&&s===0)throw new Error("num_heads must be provided if rotary_embedding_dim is specified");let u=r.dims[0],l=r.dims[r.dims.length-2],d=a.dims[0],p=U.sizeFromDimension(r.dims,1)/l,h=o===0?a.dims[1]*2:p/s;if(o>h)throw new Error("rotary_embedding_dim must be less than or equal to head_size");if(i.dims.length===2){if(u!==i.dims[0])throw new Error(`Input 'position_ids' dimension 0 should be of size batch_size, got ${i.dims[0]}`);if(l!==i.dims[1])throw new Error(`Input 'position_ids' dimension 1 should be of size sequence_length, got ${i.dims[1]}`)}if(h/2!==a.dims[1]&&o/2!==a.dims[1])throw new Error(`Input 'cos_cache' dimension 1 should be same as head_size / 2 or rotary_embedding_dim / 2, got ${a.dims[1]}`);if(l>d)throw new Error("Updating cos_cache and sin_cache in RotaryEmbedding is not currently supported")},Wa=(e,t)=>{let{interleaved:r,numHeads:i,rotaryEmbeddingDim:a,scale:n}=t,s=e[0].dims[0],o=U.sizeFromDimension(e[0].dims,1),u=e[0].dims[e[0].dims.length-2],l=o/u,d=e[2].dims[1],p=a===0?d*2:l/i,h=new Array(s,u,l/p,p-d),f=U.computeStrides(h),m=[{type:1,data:n},{type:12,data:h},{type:12,data:f},...e[0].dims.length===3?new Array({type:12,data:[o,l,p,1]}):[],...e[0].dims.length===4?new Array({type:12,data:[o,p,u*p,1]}):[],...E(e[0].dims,e[1].dims,e[2].dims,e[3].dims,e[0].dims)],y=v=>{let _=O("input",e[0].dataType,e[0].dims.length),w=O("position_ids",e[1].dataType,e[1].dims.length),S=O("cos_cache",e[2].dataType,e[2].dims.length),x=O("sin_cache",e[3].dataType,e[3].dims.length),z=Z("output",e[0].dataType,e[0].dims.length);return v.registerUniforms([{name:"scale",type:"f32"},{name:"global_shape",type:"u32",length:h.length},{name:"global_strides",type:"u32",length:f.length},{name:"input_output_strides",type:"u32",length:f.length}]),`
        ${v.declareVariables(_,w,S,x,z)}

        ${v.mainStart(T)}
          let half_rotary_emb_dim = uniforms.${S.name}_shape[1];
          let bsnh = global_idx / uniforms.global_strides % uniforms.global_shape;
          let size = uniforms.global_shape[0] * uniforms.global_strides[0];
          ${v.guardAgainstOutOfBoundsWorkgroupSizes("size")}

          if (bsnh[3] < half_rotary_emb_dim) {
            let position_ids_idx =
                ${w.broadcastedIndicesToOffset("bsnh.xy",Z("",w.type.tensor,2))};
            let position_id =
                u32(${w.getByOffset("position_ids_idx")}) + select(0, bsnh[1], position_ids_idx == 0);
            let i = dot(bsnh, uniforms.input_output_strides) + select(0, bsnh[3], ${r});
            let j = i + select(half_rotary_emb_dim, 1, ${r});
            let re = ${_.getByOffset("i")} * ${S.get("position_id","bsnh[3]")} -
                ${_.getByOffset("j")} * ${x.get("position_id","bsnh[3]")};
            ${z.setByOffset("i","re")}
            let im = ${_.getByOffset("i")} * ${x.get("position_id","bsnh[3]")} +
                ${_.getByOffset("j")} * ${S.get("position_id","bsnh[3]")};
            ${z.setByOffset("j","im")}
          } else {
            let k = dot(bsnh, uniforms.input_output_strides) + half_rotary_emb_dim;
            ${z.setByOffset("k",_.getByOffset("k"))}
          }
        }`};return{name:"RotaryEmbedding",shaderCache:{hint:g({interleaved:r}).cacheKey,inputDependencies:["rank","rank","rank","rank"]},getShaderSource:y,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(U.size(h)/T)},programUniforms:m})}},Kl=(e,t)=>{jl(e.inputs,t),e.compute(Wa(e.inputs,t))}}),Ql,Xl,Wn,Yl,Jl,Zc=C(()=>{b(),pe(),yn(),Nl(),Hl(),at(),Zl(),ie(),Ql=(e,t)=>{if(t.doRotary&&e.length<=7)throw new Error("cos_cache and sin_cache inputs are required if do_rotary is specified");let r=e[0],i=e[1],a=e[2],n=e[3],s=e[4];if(t.doRotary!==0&&e.length<=7)throw new Error("cos_cast and sin_cache are expected if do_rotary attribute is non-zero");if(t.localWindowSize!==-1)throw new Error("Local attention is not supported");if(t.softcap!==0)throw new Error("Softcap is not supported");if(t.rotaryInterleaved!==0)throw new Error("Rotary interleaved is not supported");if(t.smoothSoftmax)throw new Error("Smooth softmax is not supported");if(r.dims.length!==3&&r.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let o=!1,u=r.dims[0],l=r.dims[1],d=r.dims.length===3?o?r.dims[2]/3:r.dims[2]:t.numHeads*r.dims[4],p=l,h=0,f=!i||i.dims.length===0,m=Math.floor(f?d/(t.numHeads+2*t.kvNumHeads):d/t.numHeads);f&&(d=m*t.numHeads);let y=n&&n.dims.length!==0,v=s&&s.dims.length!==0;if(y&&n.dims.length===4&&n.dims[0]===u&&n.dims[1]!==t.kvNumHeads&&n.dims[2]===t.kvNumHeads&&n.dims[3]===m)throw new Error("BSNH pastKey/pastValue is not supported");if(y&&v){if(n.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(s.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');h=n.dims[2]}else if(y||v)throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let _=1;if(i&&i.dims.length>0){if(r.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(i.dims.length<3||i.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(r.dims[0]!==i.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(i.dims.length===3){if(r.dims[2]%i.dims[2]!==0)throw new Error('Dimension 2 of "query" should be a multiple of "key"');p=i.dims[1]}else if(i.dims.length===5){if(i.dims[2]!==t.numHeads||i.dims[3]!==2||i.dims[4]!==m)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(a)throw new Error('Expect "value" be none when "key" has packed kv format.');p=i.dims[1]}else{if(i.dims[1]!==t.numHeads||i.dims[3]!==m)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');p=i.dims[2]}}else{if(r.dims.length!==3&&r.dims.length!==5)throw new Error('Input "query" is expected to have 3 or 5 dimensions when key is empty');if(r.dims.length===5&&(r.dims[2]!==t.numHeads||r.dims[3]!==3))throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');_=3}let w=0,S=!1,x=t.kvNumHeads?m*t.kvNumHeads:d;if(a&&a.dims.length>0){if(a.dims.length!==3&&a.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(r.dims[0]!==a.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(a.dims.length===3){if(p!==a.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');x=a.dims[2]}else{if(p!==a.dims[2])throw new Error('Input "past_key" and "past_value" shall have the same dim 2 (kv_sequence_length)');x=a.dims[1]*a.dims[3],S=!0}}let z=e.length>4?e[5]:void 0;if(z&&z.dims.length!==1&&z.dims[0]!==u)throw new Error('Input "seqlens" is expected to have 1 dimension and the same dim 0 as batch_size');return{batchSize:u,sequenceLength:l,pastSequenceLength:h,kvSequenceLength:p,totalSequenceLength:-1,maxSequenceLength:-1,inputHiddenSize:0,hiddenSize:d,vHiddenSize:x,headSize:m,vHeadSize:Math.floor(x/t.kvNumHeads),numHeads:t.numHeads,kvNumHeads:t.kvNumHeads,nReps:t.numHeads/t.kvNumHeads,pastPresentShareBuffer:!1,maskType:w,scale:t.scale,broadcastResPosBias:!1,passPastInKv:S,qkvFormat:_}},Xl=g({perm:[0,2,1,3]}),Wn=(e,t,r)=>{let i=t,a=r.kvNumHeads;return t.dims.length===3&&r.kvSequenceLength!==0&&(i=t.reshape([r.batchSize,r.kvSequenceLength,a,r.headSize]),i=e.compute(ct(i,Xl.perm),{inputs:[i],outputs:[-1]})[0]),i},Yl=(e,t,r,i)=>{let a=7,n=["type","type"],s=[e*t],o=e*t,u=[{type:12,data:o},{type:12,data:t},{type:12,data:e}],l=d=>{let p=O("seq_lens",r.dataType,r.dims),h=O("total_seq_lens",i.dataType,i.dims),f=Z("pos_ids",a,s),m=[{name:"output_size",type:"u32"},{name:"sequence_length",type:"u32"},{name:"batch_size",type:"u32"}];return`
  ${d.registerUniforms(m).declareVariables(p,h,f)}
  ${d.mainStart()}
    ${d.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let total_sequence_length = u32(${h.getByOffset("0")});
    let is_subsequent_prompt = uniforms.sequence_length > 1 && uniforms.sequence_length != total_sequence_length;
    let is_first_prompt = !is_subsequent_prompt && uniforms.sequence_length == total_sequence_length;
    let batch_idx = global_idx / uniforms.sequence_length;
    let sequence_idx = i32(global_idx % uniforms.sequence_length);
    var pos_id: i32 = 0;
    let seqlen = ${p.getByOffset("batch_idx")};
    let total_seqlen = seqlen + 1;
    if (is_first_prompt) {
      if (sequence_idx < total_seqlen) {
        pos_id = sequence_idx;
      } else {
        pos_id = 1;
      }
      ${f.setByOffset("global_idx","pos_id")}
    } else if (is_subsequent_prompt) {
      let past_seqlen = total_seqlen - i32(uniforms.sequence_length);
      if (past_seqlen + sequence_idx < total_seqlen) {
        pos_id = past_seqlen + sequence_idx;
      } else {
        pos_id = 1;
      }
      ${f.setByOffset("global_idx","pos_id")}
    } else if (global_idx < uniforms.batch_size) {
      ${f.setByOffset("global_idx","seqlen")}
    };
  }
  `};return{name:"GeneratePositionIds",shaderCache:{hint:`${e};${t}`,inputDependencies:n},getRunData:()=>({outputs:[{dims:s,dataType:a}],dispatchGroup:{x:Math.ceil(o/64)},programUniforms:u}),getShaderSource:l}},Jl=(e,t)=>{var x;let r=Ql(e.inputs,t);if(e.inputs[0].dims.length===5)throw new Error("Packed QKV is not implemented");if(((x=e.inputs[1])==null?void 0:x.dims.length)===5)throw new Error("Packed KV is not implemented");let i=e.inputs[0],a=e.inputs[1]&&e.inputs[1].dims.length>0?e.inputs[1]:void 0,n=e.inputs[2]&&e.inputs[2].dims.length>0?e.inputs[2]:void 0,s=e.inputs[3]&&e.inputs[3].dims.length!==0?e.inputs[3]:void 0,o=e.inputs[4]&&e.inputs[4].dims.length!==0?e.inputs[4]:void 0,u=e.inputs.length>4?e.inputs[5]:void 0,l=e.inputs.length>5?e.inputs[6]:void 0,d=r.kvNumHeads?r.kvNumHeads:r.numHeads,p=g({axis:2,numOutputs:3,splitSizes:[r.numHeads*r.headSize,d*r.headSize,d*r.headSize]}),[h,f,m]=!a&&!n?e.compute(Vn([i],p),{inputs:[i],outputs:[-1,-1,-1]}):[i,a,n],y,v;if(t.doRotary){let z=e.compute(Yl(r.batchSize,r.sequenceLength,u,l),{inputs:[u,l],outputs:[-1]})[0],D=e.inputs[7],M=e.inputs[8],N=g({interleaved:t.rotaryInterleaved!==0,numHeads:r.numHeads,rotaryEmbeddingDim:0,scale:t.scale}),W=[h,z,D,M],Q=[-1];y=e.compute(Wa(W,N),{inputs:W,outputs:Q})[0],W.splice(0,1,f);let de=g({interleaved:t.rotaryInterleaved!==0,numHeads:r.kvNumHeads,rotaryEmbeddingDim:0,scale:t.scale});v=e.compute(Wa(W,de),{inputs:W,outputs:Q})[0]}let _=fa(e,r.batchSize,r.numHeads,r.sequenceLength,r.headSize,t.doRotary?y:h,void 0,0),w=Wn(e,t.doRotary?v:f,r),S=Wn(e,m,r);la(e,_,w,S,void 0,void 0,s,o,void 0,r,u,l)}}),Fn,ed,td,rd,Qc=C(()=>{pe(),ne(),at(),ie(),Fn=(e,t,r,i,a,n,s,o)=>{let u=B(n),l=u===1?"f32":`vec${u}f`,d=u===1?"vec2f":`mat2x${u}f`,p=a*s,h=64;p===1&&(h=256);let f=[a,s,n/u],m=[a,s,2],y=["rank","type","type"],v=[];v.push(...E(f,m));let _=w=>{let S=O("x",t.dataType,3,u),x=O("scale",r.dataType,r.dims),z=O("bias",i.dataType,i.dims),D=Z("output",1,3,2),M=[S,x,z,D];return`
  var<workgroup> workgroup_shared : array<${d}, ${h}>;
  const workgroup_size = ${h}u;
  ${w.declareVariables(...M)}
  ${w.mainStart(h)}
    let batch = workgroup_index / uniforms.x_shape[1];
    let channel = workgroup_index % uniforms.x_shape[1];
    let hight = uniforms.x_shape[2];
    // initialize workgroup memory
    var sum = ${l}(0);
    var squared_sum = ${l}(0);
    for (var h = local_idx; h < hight; h += workgroup_size) {
      let value = ${l}(${S.get("batch","channel","h")});
      sum += value;
      squared_sum += value * value;
    }
    workgroup_shared[local_idx] = ${d}(sum, squared_sum);
    workgroupBarrier();

    for (var currSize = workgroup_size >> 1;  currSize > 0; currSize = currSize >> 1) {
      if (local_idx < currSize) {
        workgroup_shared[local_idx] = workgroup_shared[local_idx] + workgroup_shared[local_idx + currSize];
      }
      workgroupBarrier();
    }
    if (local_idx == 0) {
      let sum_final = ${j("workgroup_shared[0][0]",u)} / f32(hight * ${u});
      let squared_sum_final = ${j("workgroup_shared[0][1]",u)} / f32(hight * ${u});

      let inv_std_dev = inverseSqrt(squared_sum_final - sum_final * sum_final + f32(${o}));
      let channel_scale = inv_std_dev * f32(scale[channel]);
      let channel_shift = f32(bias[channel]) - sum_final * channel_scale;
      output[workgroup_index] = vec2f(channel_scale, channel_shift);
    }
  }`};return e.compute({name:"InstanceNormComputeChannelScaleShift",shaderCache:{hint:`${u};${o};${h}`,inputDependencies:y},getRunData:()=>({outputs:[{dims:m,dataType:1}],dispatchGroup:{x:p},programUniforms:v}),getShaderSource:_},{inputs:[t,r,i],outputs:[-1]})[0]},ed=(e,t,r)=>{let i=t[0].dims,a=i,n=2,s=i[0],o=i[1],u=U.sizeFromDimension(i,n),l=B(u),d=U.size(a)/l,p=Fn(e,t[0],t[1],t[2],s,u,o,r.epsilon),h=[s,o,u/l],f=[s,o],m=["type","none"],y=v=>{let _=O("x",t[0].dataType,h.length,l),w=O("scale_shift",1,f.length,2),S=Z("output",t[0].dataType,h.length,l),x=[_,w,S];return`
  ${v.registerUniform("output_size","u32").declareVariables(...x)}
  ${v.mainStart()}
  ${v.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let outputIndices = ${S.offsetToIndices("global_idx")};
      let batch = outputIndices[0];
      let channel = outputIndices[1];
      let scale_shift = ${w.getByIndices("vec2<u32>(batch, channel)")};
      let value = ${_.getByOffset("global_idx")} * ${S.type.value}(scale_shift.x) + ${S.type.value}(scale_shift.y);
      ${S.setByOffset("global_idx","value")};
  }`};e.compute({name:"InstanceNormalization",shaderCache:{hint:`${l}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:a,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:[{type:12,data:d},...E(h,f,h)]}),getShaderSource:y},{inputs:[t[0],p]})},td=(e,t,r)=>{let i=t[0].dims,a=i,n=i[0],s=i[i.length-1],o=U.sizeFromDimension(i,1)/s,u=B(s),l=U.size(a)/u,d=[{type:12,data:o},{type:12,data:Math.floor(s/u)}],p=["type","type"],h=!1,f=[0,i.length-1];for(let _=0;_<i.length-2;_++)h=h||i[_+1]!==1,f.push(_+1);h=h&&i[i.length-1]!==1;let m=h?e.compute(ct(e.inputs[0],f),{inputs:[e.inputs[0]],outputs:[-1]})[0]:e.inputs[0].reshape(Array.from({length:i.length},(_,w)=>i[f[w]])),y=Fn(e,m,t[1],t[2],n,o,s,r.epsilon),v=_=>{let w=R(t[0].dataType),S=u===1?"vec2f":`mat${u}x2f`,x=M=>{let N=M===0?"x":"y",W=u===1?"f32":`vec${u}f`;switch(u){case 1:return`${w}(${W}(scale.${N}))`;case 2:return`vec2<${w}>(${W}(scale[0].${N}, scale[1].${N}))`;case 4:return`vec4<${w}>(${W}(scale[0].${N}, scale[1].${N}, scale[2].${N}, scale[3].${N}))`;default:throw new Error(`Not supported compoents ${u}`)}},z=O("input",t[0].dataType,t[0].dims,u),D=Z("output",t[0].dataType,a,u);return`
  @group(0) @binding(0) var<storage, read> input : array<${z.type.storage}>;
  @group(0) @binding(1) var<storage, read> scale_input : array<${S}>;
  @group(0) @binding(2) var<storage, read_write> output : array<${D.type.storage}>;
  struct Uniforms {H: u32, C : u32};
  @group(0) @binding(3) var<uniform> uniforms: Uniforms;

  ${_.mainStart()}
    let current_image_number = global_idx / (uniforms.C * uniforms.H);
    let current_channel_number = global_idx % uniforms.C;

    let scale_offset = current_image_number * uniforms.C + current_channel_number;
    let scale = scale_input[scale_offset];
    output[global_idx] = fma(input[global_idx], ${x(0)}, ${x(1)});
  }`};e.compute({name:"InstanceNormalizationNHWC",shaderCache:{hint:`${u}`,inputDependencies:p},getRunData:()=>({outputs:[{dims:a,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:d}),getShaderSource:v},{inputs:[t[0],y]})},rd=(e,t)=>{t.format==="NHWC"?td(e,e.inputs,t):ed(e,e.inputs,t)}}),id,ad,nd,Xc=C(()=>{pe(),ne(),ie(),id=e=>{if(!e||e.length<2)throw new Error("layerNorm requires at least 2 inputs.")},ad=(e,t,r)=>{let i=t.simplified,a=e[0].dims,n=e[1],s=!i&&e[2],o=a,u=U.normalizeAxis(t.axis,a.length),l=U.sizeToDimension(a,u),d=U.sizeFromDimension(a,u),p=U.size(n.dims),h=s?U.size(s.dims):0;if(p!==d||s&&h!==d)throw new Error(`Size of X.shape()[axis:] == ${d}.
       Size of scale and bias (if provided) must match this.
       Got scale size of ${p} and bias size of ${h}`);let f=[];for(let z=0;z<a.length;++z)z<u?f.push(a[z]):f.push(1);let m=B(d),y=["type","type"],v=[{type:12,data:l},{type:1,data:d},{type:12,data:Math.floor(d/m)},{type:1,data:t.epsilon}];s&&y.push("type");let _=r>1,w=r>2,S=z=>{let D=R(e[0].dataType),M=[O("x",e[0].dataType,e[0].dims,m),O("scale",n.dataType,n.dims,m)];s&&M.push(O("bias",s.dataType,s.dims,m)),M.push(Z("output",e[0].dataType,o,m)),_&&M.push(Z("mean_data_output",1,f)),w&&M.push(Z("inv_std_output",1,f));let N=[{name:"norm_count",type:"u32"},{name:"norm_size",type:"f32"},{name:"norm_size_vectorized",type:"u32"},{name:"epsilon",type:"f32"}];return`
  ${z.registerUniforms(N).declareVariables(...M)}
  ${z.mainStart()}
    ${z.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.norm_count")}
    let offset = global_idx * uniforms.norm_size_vectorized;
    var mean_vector = ${V("f32",m)};
    var mean_square_vector = ${V("f32",m)};

    for (var h: u32 = 0u; h < uniforms.norm_size_vectorized; h++) {
      let value = ${G(D,m,"x[h + offset]")};
      mean_vector += value;
      mean_square_vector += value * value;
    }
    let mean = ${j("mean_vector",m)} / uniforms.norm_size;
    let inv_std_dev = inverseSqrt(${j("mean_square_vector",m)} / uniforms.norm_size ${i?"":"- mean * mean"} + uniforms.epsilon);

    for (var j: u32 = 0; j < uniforms.norm_size_vectorized; j++) {
      let f32input = ${G(D,m,"x[j + offset]")};
      let f32scale = ${G(D,m,"scale[j]")};
      output[j + offset] = ${M[0].type.value}((f32input ${i?"":"- mean"}) * inv_std_dev * f32scale
        ${s?`+ ${G(D,m,"bias[j]")}`:""}
      );
    }

    ${_?"mean_data_output[global_idx] = mean":""};
    ${w?"inv_std_output[global_idx] = inv_std_dev":""};
  }`},x=[{dims:o,dataType:e[0].dataType}];return _&&x.push({dims:f,dataType:1}),w&&x.push({dims:f,dataType:1}),{name:"LayerNormalization",shaderCache:{hint:`${m};${r};${i}`,inputDependencies:y},getRunData:()=>({outputs:x,dispatchGroup:{x:Math.ceil(l/64)},programUniforms:v}),getShaderSource:S}},nd=(e,t)=>{id(e.inputs),e.compute(ad(e.inputs,t,e.outputCount))}}),sd,od,Yc=C(()=>{ne(),Tn(),Cn(),sd=e=>{if(!e||e.length!==2)throw new Error("MatMul requires 2 inputs.");if(e[0].dims[e[0].dims.length-1]!==e[1].dims[e[1].dims.length-2])throw new Error("shared dimension does not match.")},od=e=>{sd(e.inputs);let t=Zt.calcShape(e.inputs[0].dims,e.inputs[1].dims,!0);if(!t)throw new Error("Can't use matmul on the given tensors");let r=t[t.length-1],i=e.inputs[0].dims[e.inputs[0].dims.length-1];if(r<8&&i<8)e.compute(Sn(e.inputs,{activation:""},t));else{let a=t[t.length-2],n=U.size(e.inputs[0].dims.slice(0,-2)),s=U.size(e.inputs[1].dims.slice(0,-2));if(n!==1&&a===1&&s===1){let o=e.inputs[0].reshape([1,n,i]),u=e.inputs[1].reshape([1,i,r]),l=[1,n,r],d=[o,u];e.compute(Ua(d,{activation:""},t,l),{inputs:d})}else e.compute(Ua(e.inputs,{activation:""},t))}}}),ud,ld,dd,pd,cd,Jc=C(()=>{pe(),ne(),b(),ie(),ud=(e,t)=>{if(e.length<3||e.length>4)throw new Error("MatMulNBits requires 3 or 4 inputs");let r=e[0],i=r.dims.length;if(r.dims[i-1]!==t.k)throw new Error("The last dim of input shape does not match the k value");let a=Math.floor((t.k+t.blockSize-1)/t.blockSize),n=t.blockSize/8*t.bits,s=e[1];if(!U.areEqual(s.dims,[t.n,a,n]))throw new Error("The second inputs must be 3D tensor with shape N X nBlocksPerCol X blobSize");let o=e[2].dims;if(U.size(o)!==t.n*a)throw new Error("scales input size error.");if(e.length===4){let u=e[3].dims,l=t.n*(t.bits===8?a:Math.floor((a*t.bits+7)/8));if(U.size(u)!==l)throw new Error("zeroPoints input size error.")}},ld=(e,t)=>{let r=e[0].dims,i=r.length,a=r[i-2],n=t.k,s=t.n,o=r.slice(0,i-2),u=U.size(o),l=e[1].dims[2]/4,d=e[0].dataType,p=B(t.k),h=B(l),f=B(s),m=o.concat([a,s]),y=a>1&&s/f%2===0?2:1,v=U.size(m)/f/y,_=64,w=[],S=[u,a,n/p],x=U.convertShape(e[1].dims).slice();x.splice(-1,1,l/h),w.push(...E(S)),w.push(...E(x)),w.push(...E(e[2].dims)),e.length===4&&w.push(...E(U.convertShape(e[3].dims)));let z=[u,a,s/f];w.push(...E(z));let D=M=>{let N=S.length,W=O("a",e[0].dataType,N,p),Q=O("b",12,x.length,h),de=O("scales",e[2].dataType,e[2].dims.length),te=[W,Q,de],ue=e.length===4?O("zero_points",12,e[3].dims.length):void 0;ue&&te.push(ue);let Ae=z.length,be=Z("output",e[0].dataType,Ae,f),se=R(e[0].dataType),$e=(()=>{switch(p){case 1:return`array<${se}, 8>`;case 2:return`mat4x2<${se}>`;case 4:return`mat2x4<${se}>`;default:throw new Error(`${p}-component is not supported.`)}})(),ae=()=>{let q=`
          // reuse a data
            var input_offset = ${W.indicesToOffset(`${W.type.indices}(batch, row, word_offset)`)};
            var a_data: ${$e};
            for (var j: u32 = 0; j < ${8/p}; j++) {
              a_data[j] = ${W.getByOffset("input_offset")};
              input_offset++;
            }
          `;for(let Y=0;Y<f*y;Y++)q+=`
            b_value = ${h===1?`b${Y}_data`:`b${Y}_data[i]`};
            b_value_lower = unpack4xU8(b_value & b_mask);
            b_value_upper = unpack4xU8((b_value >> 4) & b_mask);
            b_quantized_values = ${$e}(${Array.from({length:4},(oe,xe)=>`${se}(b_value_lower[${xe}]), ${se}(b_value_upper[${xe}])`).join(", ")});
            b_dequantized_values = ${p===1?`${$e}(${Array.from({length:8},(oe,xe)=>`(b_quantized_values[${xe}] - ${ue?`zero_point${Y}`:"zero_point"}) * scale${Y}`).join(", ")});`:`(b_quantized_values - ${$e}(${Array(8).fill(`${ue?`zero_point${Y}`:"zero_point"}`).join(",")})) * scale${Y};`};
            workgroup_shared[local_id.x * ${y} + ${Math.floor(Y/f)}]${f>1?`[${Y%f}]`:""} += ${Array.from({length:8/p},(oe,xe)=>`${p===1?`a_data[${xe}] * b_dequantized_values[${xe}]`:`dot(a_data[${xe}], b_dequantized_values[${xe}])`}`).join(" + ")};
          `;return q},fe=()=>{let q=`
            var col_index = col * ${f};
            ${ue?`
            let zero_point_bytes_per_col = (nBlocksPerCol + 1) / 2;
            var zero_point_byte_count: u32;
            var zero_point_word_index: u32;
            var zero_point_byte_offset: u32;
            let zero_point_nibble_offset: u32 = block & 0x1u;
            var zero_point_bits_offset: u32;
            var zero_point_word: u32;`:`
            // The default zero point is 8 for unsigned 4-bit quantization.
            let zero_point = ${se}(8);`}
            `;for(let Y=0;Y<f*y;Y++)q+=`
            let scale${Y} = ${de.getByOffset("col_index * nBlocksPerCol + block")};
            ${ue?`
            zero_point_byte_count = col_index * zero_point_bytes_per_col + (block >> 0x1u);
            zero_point_word_index = zero_point_byte_count >> 0x2u;
            zero_point_byte_offset = zero_point_byte_count & 0x3u;
            zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_nibble_offset << 2);
            zero_point_word = ${ue.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point${Y} = ${se}((zero_point_word) & 0xFu);`:""}
            col_index += 1;`;return q},ot=()=>{let q=`col_index = col * ${f};`;for(let Y=0;Y<f*y;Y++)q+=`
            let b${Y}_data = ${Q.getByIndices(`${Q.type.indices}(col_index, block, word)`)};
            col_index += 1;`;return q+=`
            var b_value: u32;
            let b_mask: u32 = 0x0F0F0F0Fu;
            var b_value_lower: vec4<u32>;
            var b_value_upper: vec4<u32>;
            var b_quantized_values: ${$e};
            var b_dequantized_values: ${$e};`,q};return`
        var<workgroup> workgroup_shared: array<${be.type.value}, ${y*_}>;
        ${M.declareVariables(...te,be)}
        ${M.mainStart([_,1,1])}
          let output_indices = ${be.offsetToIndices(`(global_idx / ${_}) * ${y}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let nBlocksPerCol = uniforms.b_shape[1];

          for (var block = local_id.x; block < nBlocksPerCol; block += ${_}) {
            //process one block
            var word_offset: u32 = block * ${t.blockSize/p};
            ${fe()}
            for (var word: u32 = 0; word < ${l}; word += ${h}) {
              ${ot()}
              for (var i: u32 = 0; i < ${h}; i++) {
                ${ae()}
                word_offset += ${8/p};
              }
            }
          }
          workgroupBarrier();

          if (local_id.x < ${y}) {
            var output_value: ${be.type.value} = ${be.type.value}(0);
            var workgroup_shared_offset: u32 = local_id.x;
            for (var b: u32 = 0u; b < ${_}u; b++) {
              output_value += workgroup_shared[workgroup_shared_offset];
              workgroup_shared_offset += ${y};
            }
            ${be.setByIndices(`${be.type.indices}(batch, row, col + local_id.x)`,"output_value")};
          }
        }`};return{name:"MatMulNBits",shaderCache:{hint:`${t.blockSize};${t.bits};${p};${h};${f};${y};${_}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:m,dataType:d}],dispatchGroup:{x:v},programUniforms:w}),getShaderSource:D}},dd=(e,t)=>{let r=e[0].dims,i=r.length,a=r[i-2],n=t.k,s=t.n,o=r.slice(0,i-2),u=U.size(o),l=e[1].dims[2]/4,d=e[0].dataType,p=B(t.k),h=B(l),f=o.concat([a,s]),m=128,y=s%8===0?8:s%4===0?4:1,v=m/y,_=v*h*8,w=_/p,S=_/t.blockSize,x=U.size(f)/y,z=[],D=[u,a,n/p],M=U.convertShape(e[1].dims).slice();M.splice(-1,1,l/h),z.push(...E(D)),z.push(...E(M)),z.push(...E(e[2].dims)),e.length===4&&z.push(...E(U.convertShape(e[3].dims)));let N=[u,a,s];z.push(...E(N));let W=Q=>{let de=D.length,te=O("a",e[0].dataType,de,p),ue=O("b",12,M.length,h),Ae=O("scales",e[2].dataType,e[2].dims.length),be=[te,ue,Ae],se=e.length===4?O("zero_points",12,e[3].dims.length):void 0;se&&be.push(se);let $e=N.length,ae=Z("output",e[0].dataType,$e),fe=R(e[0].dataType),ot=()=>{switch(p){case 1:return`
          let a_data0 = vec4<${fe}>(sub_a[word_offset], sub_a[word_offset + 1], sub_a[word_offset + 2], sub_a[word_offset + 3]);
          let a_data1 = vec4<${fe}>(sub_a[word_offset + 4], sub_a[word_offset + 5], sub_a[word_offset + 6], sub_a[word_offset + 7]);`;case 2:return`
          let a_data0 = vec4<${fe}>(sub_a[word_offset], sub_a[word_offset + 1]);
          let a_data1 = vec4<${fe}>(sub_a[word_offset + 2], sub_a[word_offset + 3]);`;case 4:return`
          let a_data0 = sub_a[word_offset];
          let a_data1 = sub_a[word_offset + 1];`;default:throw new Error(`${p}-component is not supported.`)}};return`
        var<workgroup> sub_a: array<${te.type.value}, ${w}>;
        var<workgroup> inter_results: array<array<${ae.type.value}, ${v}>, ${y}>;
        ${Q.declareVariables(...be,ae)}
        ${Q.mainStart([v,y,1])}
          let output_indices = ${ae.offsetToIndices(`workgroup_index * ${y}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let n_blocks_per_col = uniforms.b_shape[1];
          let num_tiles =  (n_blocks_per_col - 1) / ${S} + 1;

          // Loop over shared dimension.
          for (var tile: u32 = 0; tile < num_tiles; tile += 1) {
            let a_col_start = tile * ${w};
            // load one tile A data into shared memory.
            for (var a_offset = local_idx; a_offset < ${w}; a_offset += ${m})
            {
              let a_col = a_col_start + a_offset;
              if (a_col < uniforms.a_shape[2])
              {
                sub_a[a_offset] = ${te.getByIndices(`${te.type.indices}(batch, row, a_col)`)};
              } else {
                sub_a[a_offset] = ${te.type.value}(0);
              }
            }
            workgroupBarrier();

            // each thread process one block
            let b_row = col + local_id.y;
            let block = tile * ${S} + local_id.x;
            ${se?`
            let zero_point_bytes_per_col = (n_blocks_per_col + 1) / 2;
            let zero_point_byte_count = b_row * zero_point_bytes_per_col + (block >> 0x1u);
            let zero_point_word_index = zero_point_byte_count >> 0x2u;
            let zero_point_byte_offset = zero_point_byte_count & 0x3u;
            let zero_point_nibble_offset: u32 = block & 0x1u;
            let zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_nibble_offset << 2);
            let zero_point_word = ${se.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point = ${fe}((zero_point_word) & 0xFu);`:`
            // The default zero point is 8 for unsigned 4-bit quantization.
            let zero_point = ${fe}(8);`}
            let scale = ${Ae.getByOffset("b_row * n_blocks_per_col + block")};
            let b_data = ${ue.getByIndices(`${ue.type.indices}(b_row, block, 0)`)};
            var word_offset = local_id.x * ${t.blockSize/p};
            for (var i: u32 = 0; i < ${h}; i++) {
              ${ot()}
              let b_value = ${h===1?"b_data":"b_data[i]"};
              let b_value_lower = unpack4xU8(b_value & 0x0F0F0F0Fu);
              let b_value_upper = unpack4xU8((b_value >> 4) & 0x0F0F0F0Fu);
              let b_quantized_values = mat2x4<${fe}>(${Array.from({length:4},(q,Y)=>`${fe}(b_value_lower[${Y}]), ${fe}(b_value_upper[${Y}])`).join(", ")});
              let b_dequantized_values = (b_quantized_values - mat2x4<${fe}>(${Array(8).fill("zero_point").join(",")})) * scale;
              inter_results[local_id.y][local_id.x] += ${Array.from({length:2},(q,Y)=>`${`dot(a_data${Y}, b_dequantized_values[${Y}])`}`).join(" + ")};
              word_offset += ${8/p};
            }
            workgroupBarrier();
          }

          if (local_idx < ${y}) {
            var output_value: ${ae.type.value} = ${ae.type.value}(0);
            for (var b = 0u; b < ${v}; b++) {
              output_value += inter_results[local_idx][b];
            }
            if (col + local_idx < uniforms.output_shape[2])
            {
              ${ae.setByIndices(`${ae.type.indices}(batch, row, col + local_idx)`,"output_value")}
            }
          }
        }`};return{name:"BlockwiseMatMulNBits32",shaderCache:{hint:`${t.blockSize};${p};${h};${v};${y}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:f,dataType:d}],dispatchGroup:{x},programUniforms:z}),getShaderSource:W}},pd=(e,t)=>{ud(e.inputs,t),t.blockSize===32&&e.adapterInfo.isVendor("intel")&&e.adapterInfo.isArchitecture("gen-12lp")?e.compute(dd(e.inputs,t)):e.compute(ld(e.inputs,t))},cd=e=>g(e)}),hd,fd,md,gd,yd,wd,_d,bd,vd,eh=C(()=>{pe(),ne(),ie(),hd=e=>{if(!e||e.length<1)throw new Error("Too few inputs");if(e[0].dataType!==1&&e[0].dataType!==10)throw new Error("Input type must be float or float16.");if(e.length>=2){let t=e[0].dims.length*2===e[1].dims[0];if(e.length===4&&(t=e[3].dims[0]*2===e[1].dims[0]),!t)throw new Error("The pads should be a 1D tensor of shape [2 * input_rank] or [2 * num_axes].")}},fd=(e,t,r)=>{let i="";for(let a=t-1;a>=0;--a)i+=`
            k = i32(${e.indicesGet("indices",a)}) - ${P("uniforms.pads",a,r)};
            if (k < 0) {
              break;
            }
            if (k >= i32(${P("uniforms.x_shape",a,t)})) {
              break;
            }
            offset += k * i32(${P("uniforms.x_strides",a,t)});
        `;return`
          value = ${e.type.value}(uniforms.constant_value);
          for (var i = 0; i < 1; i++) {
            var offset = 0;
            var k = 0;
            ${i}
            value = x[offset];
          }
      `},md=(e,t,r)=>{let i="";for(let a=t-1;a>=0;--a)i+=`
                k = i32(${e.indicesGet("indices",a)}) - ${P("uniforms.pads",a,r)};
                if (k < 0) {
                  k = -k;
                }
                {
                  let _2n_1 = 2 * (i32(${P("uniforms.x_shape",a,t)}) - 1);
                  k = k % _2n_1;
                  if(k >= i32(${P("uniforms.x_shape",a,t)})) {
                    k = _2n_1 - k;
                  }
                }
                offset += k * i32(${P("uniforms.x_strides",a,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${i}
              value = x[offset];
          `},gd=(e,t,r)=>{let i="";for(let a=t-1;a>=0;--a)i+=`
                k = i32(${e.indicesGet("indices",a)}) - ${P("uniforms.pads",a,r)};
                if (k < 0) {
                  k = 0;
                }
                if (k >= i32(${P("uniforms.x_shape",a,t)})) {
                  k = i32(${P("uniforms.x_shape",a,t)}) - 1;
                }
                offset += k * i32(${P("uniforms.x_strides",a,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${i}
              value = x[offset];
          `},yd=(e,t,r)=>{let i="";for(let a=t-1;a>=0;--a)i+=`
                k = i32(${e.indicesGet("indices",a)}) - ${P("uniforms.pads",a,r)};
                if (k < 0)  {
                  k += i32(${P("uniforms.x_shape",a,t)}]);
                }
                if (k >= i32(${P("uniforms.x_shape",a,t)})) {
                  k -= i32(${P("uniforms.x_shape",a,t)});
                }
                offset += k * i32(${P("uniforms.x_strides",a,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${i}
              value = x[offset];
          `},wd=(e,t,r)=>{switch(r.mode){case 0:return fd(e,t,r.pads.length);case 1:return md(e,t,r.pads.length);case 2:return gd(e,t,r.pads.length);case 3:return yd(e,t,r.pads.length);default:throw new Error("Invalid mode")}},_d=(e,t)=>{let r=U.padShape(e[0].dims.slice(),t.pads),i=e[0].dims,a=U.size(r),n=[{type:12,data:a},{type:6,data:t.pads}],s=e.length>=3&&e[2].data;t.mode===0&&n.push({type:s?e[2].dataType:1,data:t.value}),n.push(...E(e[0].dims,r));let o=["rank"],u=l=>{let d=Z("output",e[0].dataType,r.length),p=O("x",e[0].dataType,i.length),h=p.type.value,f=wd(d,i.length,t),m=[{name:"output_size",type:"u32"},{name:"pads",type:"i32",length:t.pads.length}];return t.mode===0&&m.push({name:"constant_value",type:s?h:"f32"}),`
            ${l.registerUniforms(m).declareVariables(p,d)}
            ${l.mainStart()}
            ${l.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

            let indices = ${d.offsetToIndices("global_idx")};

            var value = ${h}(0);
            ${f}
            output[global_idx] = value;
        }`};return{name:"Pad",shaderCache:{hint:`${t.mode}${s}`,inputDependencies:o},getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(U.size(r)/64)},programUniforms:n}),getShaderSource:u}},bd=(e,t)=>{if(e.length>1){let r=e[1].getBigInt64Array(),i=e.length>=3&&e[2].data?e[2].dataType===10?e[2].getUint16Array()[0]:e[2].getFloat32Array()[0]:0,a=e[0].dims.length,n=new Int32Array(2*a).fill(0);if(e.length>=4){let o=e[3].getBigInt64Array();for(let u=0;u<o.length;u++)n[Number(o[u])]=Number(r[u]),n[Number(o[u])+a]=Number(r[u+o.length])}else r.forEach((o,u)=>n[Number(u)]=Number(o));let s=[];return n.forEach(o=>s.push(o)),{mode:t.mode,value:i,pads:s}}else return t},vd=(e,t)=>{hd(e.inputs);let r=bd(e.inputs,t);e.compute(_d(e.inputs,r),{inputs:[0]})}}),ma,qn,Gn,Hn,jn,$d,xd,Kn,Zn,Sd,Td,Qn,Ed,Id,Xn,kd,Cd,Ad,zd,th=C(()=>{Je(),pe(),ne(),ie(),ma=e=>{if(re.webgpu.validateInputContent&&(!e||e.length!==1))throw new Error("Pool ops requires 1 input.")},qn=(e,t,r)=>{let i=t.format==="NHWC",a=e.dims.slice();i&&a.splice(1,0,a.pop());let n=Object.hasOwnProperty.call(t,"dilations"),s=t.kernelShape.slice(),o=t.strides.slice(),u=n?t.dilations.slice():[],l=t.pads.slice();lr.adjustPoolAttributes(r,a,s,o,u,l);let d=lr.computePoolOutputShape(r,a,o,u,s,l,t.autoPad),p=Object.assign({},t);n?Object.assign(p,{kernelShape:s,strides:o,pads:l,dilations:u,cacheKey:t.cacheKey}):Object.assign(p,{kernelShape:s,strides:o,pads:l,cacheKey:t.cacheKey});let h=d.slice();return h.push(h.splice(1,1)[0]),[p,i?h:d]},Gn=(e,t)=>{let r=t.format==="NHWC",i=U.size(e),a=U.size(t.kernelShape),n=[{type:12,data:i},{type:12,data:a}],s=[{name:"outputSize",type:"u32"},{name:"kernelSize",type:"u32"}];if(t.kernelShape.length<=2){let o=t.kernelShape[t.kernelShape.length-1],u=t.strides[t.strides.length-1],l=t.pads[t.pads.length/2-1],d=t.pads[t.pads.length-1],p=!!(l+d);n.push({type:12,data:o},{type:12,data:u},{type:12,data:l},{type:12,data:d}),s.push({name:"kw",type:"u32"},{name:"sw",type:"u32"},{name:"pwStart",type:"u32"},{name:"pwEnd",type:"u32"});let h=!1;if(t.kernelShape.length===2){let f=t.kernelShape[t.kernelShape.length-2],m=t.strides[t.strides.length-2],y=t.pads[t.pads.length/2-2],v=t.pads[t.pads.length-2];h=!!(y+v),n.push({type:12,data:f},{type:12,data:m},{type:12,data:y},{type:12,data:v}),s.push({name:"kh",type:"u32"},{name:"sh",type:"u32"},{name:"phStart",type:"u32"},{name:"phEnd",type:"u32"})}return[n,s,!0,p,h]}else{if(r)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let o=U.computeStrides(t.kernelShape);n.push({type:12,data:o},{type:12,data:t.pads},{type:12,data:t.strides}),s.push({name:"kernelStrides",type:"u32",length:o.length},{name:"pads",type:"u32",length:t.pads.length},{name:"strides",type:"u32",length:t.strides.length});let u=t.pads.reduce((l,d)=>l+d);return[n,s,!!u,!1,!1]}},Hn=(e,t,r,i,a,n,s,o,u,l,d,p)=>{let h=a.format==="NHWC",f=t.type.value,m=Z("output",t.type.tensor,i);if(a.kernelShape.length<=2){let y="",v="",_="",w=r-(h?2:1);if(d?y=`
                for (var i: u32 = 0u; i < uniforms.kw; i++) {
                  xIndices[${w}] = indices[${w}] * uniforms.sw - uniforms.pwStart + i;
                  if (xIndices[${w}] < 0 || xIndices[${w}]
                      >= uniforms.x_shape[${w}]) {
                    pad++;
                    continue;
                  }
                  let x_val = x[${t.indicesToOffset("xIndices")}];
                  ${n}
                }`:y=`
                for (var i: u32 = 0u; i < uniforms.kw; i++) {
                  xIndices[${w}] = indices[${w}] * uniforms.sw - uniforms.pwStart + i;
                  let x_val = x[${t.indicesToOffset("xIndices")}];
                  ${n}
                }`,a.kernelShape.length===2){let S=r-(h?3:2);p?v=`
                for (var j: u32 = 0u; j < uniforms.kh; j++) {
                  xIndices[${S}] = indices[${S}] * uniforms.sh - uniforms.phStart + j;
                  if (xIndices[${S}] < 0 || xIndices[${S}] >= uniforms.x_shape[${S}]) {
                    pad += i32(uniforms.kw);
                    continue;
                  }
              `:v=`
                for (var j: u32 = 0u; j < uniforms.kh; j++) {
                  xIndices[${S}] = indices[${S}] * uniforms.sh - uniforms.phStart + j;
                `,_=`
              }
            `}return`
            ${e.registerUniforms(u).declareVariables(t,m)}

            ${e.mainStart()}
              ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

              let indices = ${m.offsetToIndices("global_idx")};
              var xIndices = ${m.offsetToIndices("global_idx")};

              var value = ${f}(${o});
              var pad = 0;
              ${v}
              ${y}
              ${_}
              ${s}

              output[global_idx] = value;
            }`}else{if(h)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let y=a.kernelShape.length,v=a.pads.length,_="";return l?_=`
                if (xIndices[j] >= uniforms.x_shape[j]) {
                  pad++;
                  isPad = true;
                  break;
                }
              }
              if (!isPad) {
                let x_val = x[${t.indicesToOffset("xIndices")}];
                ${n}
              }`:_=`
              }
              let x_val = x[${t.indicesToOffset("xIndices")}];
              ${n}
            `,`
            ${e.registerUniforms(u).declareVariables(t,m)}

            ${e.mainStart()}
              ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
              let indices = ${m.offsetToIndices("global_idx")};
              var xIndices = ${m.offsetToIndices("global_idx")};

              var offsets: array<u32, ${y}>;

              var value = ${f}(${o});
              var pad = 0;
              var isPad = false;

              for (var i: u32 = 0u; i < uniforms.kernelSize; i++) {
                var offset = i;
                for (var j = 0u; j < ${y-1}u; j++) {
                  offsets[j] = offset / ${P("uniforms.kernelStrides","j",y)};
                  offset -= offsets[j] * ${P("uniforms.kernelStrides","j",y)};
                }
                offsets[${y-1}] = offset;

                isPad = false;
                for (var j = ${r-y}u; j < ${r}u; j++) {
                  xIndices[j] = indices[j] * ${P("uniforms.strides",`j - ${r-y}u`,y)}
                    + offsets[j - ${r-y}u] - ${P("uniforms.pads","j - 2u",v)};
                  ${_}
              }
              ${s}

              output[global_idx] = value;
            }`}},jn=e=>`${e.format};${e.ceilMode};${e.autoPad};${e.kernelShape.length}`,$d=e=>`${jn(e)};${e.countIncludePad}`,xd=e=>`${jn(e)};${e.storageOrder};${e.dilations}`,Kn=e=>({format:e.format,autoPad:["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],ceilMode:e.ceil_mode,kernelShape:e.kernel_shape,strides:e.strides,pads:e.pads}),Zn=(e,t,r,i)=>{let[a,n]=qn(t,i,r),s=O("x",t.dataType,t.dims.length),o=s.type.value,u="value += x_val;",l="";a.countIncludePad?l+=`value /= ${o}(uniforms.kernelSize);`:l+=`value /= ${o}(i32(uniforms.kernelSize) - pad);`;let[d,p,h,f,m]=Gn(n,a);d.push(...E(t.dims,n));let y=["rank"];return{name:e,shaderCache:{hint:`${i.cacheKey};${h};${f};${m}`,inputDependencies:y},getRunData:()=>({outputs:[{dims:n,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(U.size(n)/64)},programUniforms:d}),getShaderSource:v=>Hn(v,s,t.dims.length,n.length,a,u,l,0,p,h,f,m)}},Sd=e=>{let t=e.count_include_pad!==0,r=Kn(e);if(r.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for AveragePool");let i={countIncludePad:t,...r,cacheKey:""};return{...i,cacheKey:$d(i)}},Td=(e,t)=>{ma(e.inputs),e.compute(Zn("AveragePool",e.inputs[0],!1,t))},Qn={autoPad:"",ceilMode:0,countIncludePad:!1,kernelShape:[],strides:[],pads:[],storageOrder:0,dilations:[]},Ed=e=>{let t=e.format;return{format:t,...Qn,cacheKey:t}},Id=(e,t)=>{ma(e.inputs),e.compute(Zn("GlobalAveragePool",e.inputs[0],!0,t))},Xn=(e,t,r,i)=>{let[a,n]=qn(t,i,r),s=`
      value = max(x_val, value);
    `,o="",u=O("x",t.dataType,t.dims.length),l=["rank"],[d,p,h,f,m]=Gn(n,a);return d.push(...E(t.dims,n)),{name:e,shaderCache:{hint:`${i.cacheKey};${h};${f};${m}`,inputDependencies:l},getRunData:()=>({outputs:[{dims:n,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(U.size(n)/64)},programUniforms:d}),getShaderSource:y=>Hn(y,u,t.dims.length,n.length,a,s,o,t.dataType===10?-65504:-1e5,p,h,f,m)}},kd=(e,t)=>{ma(e.inputs),e.compute(Xn("MaxPool",e.inputs[0],!1,t))},Cd=e=>{let t=e.storage_order,r=e.dilations,i=Kn(e);if(t!==0)throw new Error("column major storage order is not yet supported for MaxPool");if(i.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for MaxPool");let a={storageOrder:t,dilations:r,...i,cacheKey:""};return{...a,cacheKey:xd(a)}},Ad=e=>{let t=e.format;return{format:t,...Qn,cacheKey:t}},zd=(e,t)=>{ma(e.inputs),e.compute(Xn("GlobalMaxPool",e.inputs[0],!0,t))}}),Od,Rd,Bd,Md,rh=C(()=>{pe(),ne(),b(),ie(),Od=(e,t)=>{if(e.length<2||e.length>3)throw new Error("DequantizeLinear requires 2 or 3 inputs.");if(e.length===3&&e[1].dims===e[2].dims)throw new Error("x-scale and x-zero-point must have the same shape.");if(e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[0].dataType===6&&e.length>2)throw new Error("In the case of dequantizing int32 there is no zero point.");if(e[1].dims.length!==0&&e[1].dims.length!==1&&e[1].dims.length!==e[0].dims.length)throw new Error("scale input must be a scalar, a 1D tensor, or have the same rank as the input tensor.");if(e.length>2){if(e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[1].dims.length!==e[2].dims.length)throw new Error("scale and zero-point inputs must have the same rank.");if(!e[1].dims.map((r,i)=>r===e[2].dims[i]).reduce((r,i)=>r&&i,!0))throw new Error("scale and zero-point inputs must have the same shape.")}if(t.blockSize>0){if(e[1].dims.length===0||e[1].dims.length===1&&e[1].dims[0]===1)throw new Error("blockSize must be set only for block quantization.");if(!e[1].dims.map((a,n)=>n===t.axis||a===e[0].dims[n]).reduce((a,n)=>a&&n,!0))throw new Error("For block qunatization, scale input shape to match the input shape except for the axis");if(e[1].dims.length!==e[0].dims.length)throw new Error("For block qunatization the scale input rank must be the same as the x rank.");let r=e[0].dims[t.axis],i=e[1].dims[t.axis];if(t.blockSize<Math.ceil(r/i)||t.blockSize>Math.ceil(r/(i-1)-1))throw new Error("blockSize must be with in the range [ceil(dI / Si), ceil(dI / (Si - 1) - 1)].")}},Rd=(e,t)=>{let r=U.normalizeAxis(t.axis,e[0].dims.length),i=e[0].dataType,a=i===3,n=e[0].dims,s=e[1].dataType,o=U.size(n),u=i===3||i===2,l=u?[Math.ceil(U.size(e[0].dims)/4)]:e[0].dims,d=e[1].dims,p=e.length>2?e[2]:void 0,h=p?u?[Math.ceil(U.size(p.dims)/4)]:p.dims:void 0,f=d.length===0||d.length===1&&d[0]===1,m=f===!1&&d.length===1,y=B(o),v=f&&(!u||y===4),_=v?y:1,w=v&&!u?y:1,S=O("input",u?12:i,l.length,w),x=O("scale",s,d.length),z=p?O("zero_point",u?12:i,h.length):void 0,D=Z("output",s,n.length,_),M=[S,x];z&&M.push(z);let N=[l,d];p&&N.push(h);let W=[{type:12,data:o/_},{type:12,data:r},{type:12,data:t.blockSize},...E(...N,n)],Q=de=>{let te=[{name:"output_size",type:"u32"},{name:"axis",type:"u32"},{name:"block_size",type:"u32"}];return`
      ${de.registerUniforms(te).declareVariables(...M,D)}
      ${de.mainStart()}
          ${de.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let output_indices = ${D.offsetToIndices("global_idx")};

          // Set input x
          ${u?`
            let input = ${S.getByOffset("global_idx / 4")};
            let x_vec = ${a?"unpack4xI8(input)":"unpack4xU8(input)"};
            let x_value = ${_===1?"x_vec[global_idx % 4]":"x_vec"};`:`let x_value = ${S.getByOffset("global_idx")};`};

          // Set scale input
          ${f?`let scale_value= ${x.getByOffset("0")}`:m?`
            let scale_index = ${D.indicesGet("output_indices","uniforms.axis")};
            let scale_value= ${x.getByOffset("scale_index")};`:`
            var scale_indices: ${x.type.indices} = output_indices;
            let index = ${x.indicesGet("scale_indices","uniforms.axis")} / uniforms.block_size;
            ${x.indicesSet("scale_indices","uniforms.axis","index")};
            let scale_value= ${x.getByIndices("scale_indices")};`};

          // Set zero-point input
          ${z?f?u?`
                let zero_point_input = ${z.getByOffset("0")};
                let zero_point_vec =  ${a?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value= zero_point_vec[0]`:`let zero_point_value = ${z.getByOffset("0")}`:m?u?`
                let zero_point_index = ${D.indicesGet("output_indices","uniforms.axis")};
                let zero_point_input = ${z.getByOffset("zero_point_index / 4")};
                let zero_point_vec =  ${a?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_index % 4]`:`
                let zero_point_index = ${D.indicesGet("output_indices","uniforms.axis")};
                let zero_point_value = ${z.getByOffset("zero_point_index")};`:u?`
                let zero_point_offset = ${x.indicesToOffset("scale_indices")};
                let zero_point_input = ${z.getByOffset("zero_point_offset / 4")};
                let zero_point_vec = ${a?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_offset % 4];`:`let zero_point_value = ${z.getByIndices("scale_indices")};`:`let zero_point_value = ${u?a?"i32":"u32":S.type.value}(0);`};
      // Compute and write output
      ${D.setByOffset("global_idx",`${D.type.value}(x_value - zero_point_value) * scale_value`)};
      }`};return{name:"DequantizeLinear",shaderCache:{hint:t.cacheKey,inputDependencies:z?["rank","rank","rank"]:["rank","rank"]},getShaderSource:Q,getRunData:()=>({outputs:[{dims:n,dataType:s}],dispatchGroup:{x:Math.ceil(o/_/64),y:1,z:1},programUniforms:W})}},Bd=(e,t)=>{Od(e.inputs,t),e.compute(Rd(e.inputs,t))},Md=e=>g({axis:e.axis,blockSize:e.blockSize})}),Dd,Pd,Ud,ih=C(()=>{Je(),pe(),ie(),Dd=(e,t,r)=>{let i=e===t,a=e<t&&r<0,n=e>t&&r>0;if(i||a||n)throw new Error("Range these inputs' contents are invalid.")},Pd=(e,t,r,i)=>{let a=Math.abs(Math.ceil((t-e)/r)),n=[a],s=a,o=[{type:12,data:s},{type:i,data:e},{type:i,data:r},...E(n)],u=l=>{let d=Z("output",i,n.length),p=d.type.value,h=[{name:"outputSize",type:"u32"},{name:"start",type:p},{name:"delta",type:p}];return`
        ${l.registerUniforms(h).declareVariables(d)}
        ${l.mainStart()}
        ${l.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        output[global_idx] = uniforms.start + ${p}(global_idx) * uniforms.delta;
      }`};return{name:"Range",shaderCache:{hint:`${i}`},getShaderSource:u,getRunData:()=>({outputs:[{dims:n,dataType:i}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:o})}},Ud=e=>{let t=0,r=0,i=0;e.inputs[0].dataType===6?(t=e.inputs[0].getInt32Array()[0],r=e.inputs[1].getInt32Array()[0],i=e.inputs[2].getInt32Array()[0]):e.inputs[0].dataType===1&&(t=e.inputs[0].getFloat32Array()[0],r=e.inputs[1].getFloat32Array()[0],i=e.inputs[2].getFloat32Array()[0]),re.webgpu.validateInputContent&&Dd(t,r,i),e.compute(Pd(t,r,i,e.inputs[0].dataType),{inputs:[]})}}),Nd,Ld,Vd,Wd,ah=C(()=>{pe(),ne(),b(),ie(),Nd=(e,t,r,i)=>{if(e!=="none"&&i!=="i32"&&i!=="u32"&&i!=="f32")throw new Error(`Input ${i} is not supported with reduction ${e}.`);let a=`{
                var oldValue = 0;
                loop {
                  let newValueF32 =`,n=`;
                  let newValue = bitcast<i32>(newValueF32);
                  let res = atomicCompareExchangeWeak(&${t}, oldValue, newValue);
                  if res.exchanged {
                    break;
                  }
                  oldValue = res.old_value;
                }
              }`;switch(e){case"none":return`${t}=${r};`;case"add":return i==="i32"||i==="u32"?`atomicAdd(&${t}, bitcast<${i}>(${r}));`:`
              ${a}bitcast<${i}>(oldValue) + (${r})${n}`;case"max":return i==="i32"||i==="u32"?`atomicMax(&${t}, bitcast<${i}>(${r}));`:`
                ${a}max(bitcast<f32>(oldValue), (${r}))${n}`;case"min":return i==="i32"||i==="u32"?`atomicMin(&${t}, bitcast<${i}>(${r}));`:`${a}min(bitcast<${i}>(oldValue), (${r}))${n}`;case"mul":return`${a}(bitcast<${i}>(oldValue) * (${r}))${n}`;default:throw new Error(`Reduction ${e} is not supported.`)}},Ld=(e,t)=>{let r=e[0].dims,i=e[1].dims,a=r,n=1,s=Math.ceil(U.sizeToDimension(i,i.length-1)/n),o=i[i.length-1],u=U.sizeFromDimension(r,o),l=[{type:12,data:s},{type:12,data:o},{type:12,data:u},...E(e[1].dims,e[2].dims,a)],d=p=>{let h=O("indices",e[1].dataType,e[1].dims.length),f=O("updates",e[2].dataType,e[2].dims.length,n),m=t.reduction!=="none"&&t.reduction!==""?Le("output",e[0].dataType,a.length):Z("output",e[0].dataType,a.length,n);return`
      ${p.registerUniform("output_size","u32").registerUniform("last_index_dimension","u32").registerUniform("num_updates_elements","u32").declareVariables(h,f,m)}
      ${p.mainStart()}
        ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
  var data_offset = 0u;
  let indices_start = uniforms.last_index_dimension * global_idx;
  let indices_end = indices_start + uniforms.last_index_dimension;
  for (var i = indices_start; i < indices_end; i++) {
    var index = i32(indices[i].x);
    ${e[0].dims.length===1?`
    let element_count_dim = uniforms.output_strides;
    let dim_value = uniforms.output_shape;`:`
    let element_count_dim = uniforms.output_strides[i - indices_start];
    let dim_value = uniforms.output_shape[i - indices_start];`}
    if (index >= 0) {
      if (index >= i32(dim_value)) {
        index = i32(dim_value - 1);
      }
    } else {
      if (index < -i32(dim_value)) {
        index = 0;
      } else {
        index += i32(dim_value);
      }
    }
    data_offset += u32((u32(index) * element_count_dim));
  }

  for (var i = 0u; i < uniforms.num_updates_elements; i++) {
    let value = updates[uniforms.num_updates_elements * global_idx + i];
    ${Nd(t.reduction,"output[data_offset + i]","value",m.type.value)}
  }

      }`};return{name:"ScatterND",shaderCache:{hint:`${t.cacheKey}_${t.reduction}`,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:a,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:l}),getShaderSource:d}},Vd=e=>g({reduction:e.reduction}),Wd=(e,t)=>{e.compute(Ld(e.inputs,t),{inputs:[e.inputs[1],e.inputs[2]],outputs:[]})}}),Fd,qd,Gd,Yn,Hd,jd,Kd,Zd,Qd,Xd,Yd,Jd,Jn,ep,tp,rp,ip,ap,np,sp,nh=C(()=>{pe(),ne(),b(),ie(),Fd=(e,t)=>{if(e.every(r=>r>0||(()=>{throw new Error("Resize requires scales input values to be positive")})),e.length>0){if(t.mode==="linear"){if(!(e.length===2||e.length===3||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1||e.length===5&&e[0]===1&&e[1]===1))throw new Error(`For linear mode, Resize requires scales to be 2D, 3D, 4D with either two outermost or one innermost and
            one outermost scale values equal to 1, or 5D with two outermost scale values equal to 1`)}else if(t.mode==="cubic"&&!(e.length===2||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1))throw new Error("Resize requires scales input size to be 2 or 4 for cubic mode")}},qd=(e,t,r)=>{t.every(a=>a>=0&&a<r||(()=>{throw new Error("Resize requires axes input values to be positive and less than rank")}));let i=new Array(r).fill(1);return t.forEach((a,n)=>i[a]=e[n]),i},Gd=(e,t,r,i,a,n)=>{let[s,o,u]=r>10?[1,2,3]:[-1,e.length>1?1:-1,-1],l=e[0].dims.length;if(s>0&&e.length>s&&e[s].dims.length>0)e[s].getFloat32Array().forEach(d=>n.push(d));else if(t.coordinateTransformMode==="tf_crop_and_resize")throw new Error("Resize requires RoI input to be specified when coordinateTransformMode is tfCropAndResize");if(o>0&&e.length>o&&e[o].dims.length===1&&e[o].dims[0]>0){if(e[o].getFloat32Array().forEach(d=>i.push(d)),i.length!==0&&i.length!==l&&r>=18&&i.length!==t.axes.length)throw new Error("Resize requires scales input size to be same as input rank or axes size for opset 18 and up");Fd(i,t),t.axes.length>0&&qd(i,t.axes,l).forEach((d,p)=>i[p]=d)}if(u>0&&e.length>u&&e[u].dims.length===1&&e[u].dims[0]>0&&(e[u].getBigInt64Array().forEach(d=>a.push(Number(d))),a.length!==0&&a.length!==l&&r>=18&&a.length!==t.axes.length))throw new Error("Resize requires sizes input size to be same as input rank or axes size for opset 18 and up");if(t.axes.length>0){if(i.length!==0&&i.length!==t.axes.length)throw new Error('Resize requires "scales" input size to be of axes rank when axes attributes is specified');if(a.length!==0&&a.length!==t.axes.length)throw new Error('Resize requires "sizes" input size to be of rank axes rank when axes attributes is specified')}if(typeof i<"u"&&typeof a<"u"&&i.length>0&&a.length>l)throw new Error("Resize requires only of scales or sizes to be specified")},Yn=(e,t,r,i)=>`
  // The whole part and the fractional part are calculated separately due to inaccuracy of floating
  // point division. As an example, f32(21) / f32(7) may evaluate to 2.99... instead of 3, causing an
  // offset-by-one error later in floor().
  let big = (${e}) * (${t});
  let whole = ${i}(big / (${r}));
  let fract = ${i}(big % (${r})) / ${i}(${r});
  return whole + fract;
`,Hd=(e,t)=>`fn getOriginalCoordinateFromResizedCoordinate(xResized: u32, xScale: f32, lengthResized: u32,
     lengthOriginal: u32, roiStart: f32, roiEnd: f32) -> ${t} { `+(()=>{switch(e){case"asymmetric":return`
          if (xScale < 1.0 || floor(xScale) != xScale) {
            return ${t}(xResized) / ${t}(xScale);
          } else {
            ${Yn("xResized","lengthOriginal","lengthResized",t)}
          }
        `;case"pytorch_half_pixel":return`if (lengthResized > 1) {
                    return (${t}(xResized) + 0.5) / ${t}(xScale) - 0.5;
                  } else {
                    return 0.0;
                  }`;case"tf_half_pixel_for_nn":return`return (${t}(xResized) + 0.5) / ${t}(xScale);`;case"align_corners":return`if (lengthResized == 1) {
                    return 0.0;
                  } else {
                    ${Yn("xResized","lengthOriginal - 1","lengthResized - 1",t)}
                  }`;case"tf_crop_and_resize":return`if (lengthResized > 1) {
                    return ${t}(roiStart) * ${t}(lengthOriginal - 1) +
                        (${t}(xResized) * ${t}(roiEnd - roiStart) * ${t}(lengthOriginal - 1)) /
                        ${t}(lengthResized - 1);
                  } else {
                    return 0.5 * ${t}(roiStart + roiEnd) * ${t}(lengthOriginal - 1);
                  }`;case"half_pixel_symmetric":return`const outputWidth = ${t}xScale * ${t}(lengthResized);
                  const adjustment = ${t}(lengthResized) / outputWidth;
                  const center = ${t}(lengthOriginal) / 2;
                  const offset = center * (1 - adjustment);
                  return offset + ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;case"half_pixel":return`return ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;default:throw new Error(`Coordinate transform mode ${e} is not supported`)}})()+"}",jd=(e,t,r)=>`fn getNearestPixelFromOriginal(xOriginal: ${r}, isDownSample: bool) -> ${r} {`+(()=>{switch(e){case"round_prefer_ceil":return"if (fract(xOriginal) == 0.5) {             return ceil(xOriginal);           } else {             return round(xOriginal);           }";case"floor":return"return floor(xOriginal);";case"ceil":return"return ceil(xOriginal);";case"round_prefer_floor":return"if (fract(xOriginal) == 0.5) {                     return floor(xOriginal);                   } else {                     return round(xOriginal);                   }";case"simple":default:if(t<11)return"if (isDownSample)                     {                       return ceil(xOriginal);                     } else {                       return xOriginal;                     }";throw new Error(`Nearest mode ${e} is not supported`)}})()+"}",Kd=(e,t,r)=>{let i=new Array(r).fill(0).concat(new Array(r).fill(1)),a=e.length===0?i:e.slice();return t.length>0?(t.forEach((n,s)=>{i[n]=a[s],i[s+r]=a[t.length+s]}),i):a},Zd=(e,t,r,i)=>{let a=[];if(r.length>0)if(i.length>0){if(e.forEach(n=>a.push(n)),Math.max(...i)>e.length)throw new Error("axes is out of bound");i.forEach((n,s)=>a[n]=r[s])}else r.forEach(n=>a.push(n));else{if(t.length===0)throw new Error("Resize requires either scales or sizes.");a=e.map((n,s)=>Math.round(n*t[s]))}return a},Qd=(e,t,r)=>{let i=(()=>{switch(r.keepAspectRatioPolicy){case"not_larger":return r.axes.length>0?Math.min(...r.axes.map(n=>t[n]),Number.MAX_VALUE):Math.min(...t,Number.MAX_VALUE);case"not_smaller":return r.axes.length>0?Math.max(...r.axes.map(n=>t[n]),Number.MIN_VALUE):Math.max(...t,Number.MIN_VALUE);default:throw new Error(`Keep aspect ratio policy ${r.keepAspectRatioPolicy} is not supported`)}})();t.fill(1,0,t.length);let a=e.slice();return r.axes.length>0?(r.axes.forEach(n=>t[n]=i),r.axes.forEach(n=>a[n]=Math.round(e[n]*t[n]))):(t.fill(i,0,t.length),a.forEach((n,s)=>a[s]=Math.round(n*t[s]))),a},Xd=(e,t,r,i,a)=>`
    fn calculateOriginalIndicesFromOutputIndices(output_indices: ${e.type.indices}) -> array<${e.type.value}, ${r.length}> {
      var original_indices: array<${e.type.value}, ${r.length}>;
      for (var i:u32 = 0; i < ${r.length}; i++) {
        var output_index = ${e.indicesGet("output_indices","i")};
        var scale = ${P("uniforms.scales","i",i)};
        var roi_low = ${P("uniforms.roi","i",a)};
        var roi_hi = ${P("uniforms.roi",`i + ${t.length}`,a)};
        if (scale == 1.0) {
          original_indices[i] = ${e.type.value}(output_index);
        } else {
          var input_shape_i = ${P("uniforms.input_shape","i",t.length)};
          var output_shape_i = ${P("uniforms.output_shape","i",r.length)};
          original_indices[i] = getOriginalCoordinateFromResizedCoordinate(output_index, scale, output_shape_i,
                                                                           input_shape_i, roi_low, roi_hi);
        }
      }
      return original_indices;
    }`,Yd=(e,t,r,i,a,n,s)=>`
    fn calculateInputIndicesFromOutputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
      var input_indices: ${e.type.indices};
      for (var i:u32 = 0; i < ${i.length}; i++) {
        var output_index = ${t.indicesGet("output_indices","i")};
        var input_index: u32;
        var scale = ${P("uniforms.scales","i",a)};
        if (scale == 1.0) {
          input_index = output_index;
        } else {
          var roi_low = ${P("uniforms.roi","i",n)};
          var roi_hi = ${P("uniforms.roi",`i + ${r.length}`,n)};
          var input_shape_i = ${P("uniforms.input_shape","i",r.length)};
          var output_shape_i = ${P("uniforms.output_shape","i",i.length)};
          var original_idx = getOriginalCoordinateFromResizedCoordinate(output_index, scale, output_shape_i,
                                                                        input_shape_i, roi_low, roi_hi);
          if (!${s} || (original_idx >= 0 && original_idx < ${t.type.value}(input_shape_i))) {
            if (original_idx < 0) {
              input_index = 0;
            } else if (original_idx > ${t.type.value}(input_shape_i - 1)) {
              input_index = input_shape_i - 1;
            } else {
              input_index = u32(getNearestPixelFromOriginal(original_idx, scale < 1));
            }
          } else {
            input_index = u32(original_idx);
          }
        }
        ${e.indicesSet("input_indices","i","input_index")}
      }
      return input_indices;
    }`,Jd=(e,t)=>`
    fn checkInputIndices(input_indices: ${e.type.indices}) -> bool {
      for (var i:u32 = 0; i < ${t.length}; i++) {
        var input_index = ${e.indicesGet("input_indices","i")};
        if (input_index < 0 || input_index >= ${P("uniforms.input_shape","i",t.length)}) {
          return false;
        }
      }
      return true;
    }`,Jn=(e,t,r,i)=>e.rank>i?`
    ${e.indicesSet("input_indices",t,"channel")};
    ${e.indicesSet("input_indices",r,"batch")};
`:"",ep=(e,t,r,i,a)=>{let[n,s,o,u]=r.length===2?[-1,0,1,-1]:[0,2,3,1],l=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, row: u32, col: u32) -> ${l} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",s,`max(0, min(row, ${r[s]} - 1))`)};
      ${e.indicesSet("input_indices",o,`max(0, min(col, ${r[o]} - 1))`)};
      ${Jn(e,u,n,2)}
      return ${e.getByIndices("input_indices")};
    }

    fn bilinearInterpolation(output_indices: ${t.type.indices}) -> ${l} {
      var originalIndices = calculateOriginalIndicesFromOutputIndices(output_indices);
      var row:${l} = originalIndices[${s}];
      var col:${l} = originalIndices[${o}];
      ${i?`if (row < 0 || row > (${r[s]} - 1) || col < 0 || col > (${r[o]} - 1)) {
        return ${a};
      }`:""};
      row = max(0, min(row, ${r[s]} - 1));
      col = max(0, min(col, ${r[o]} - 1));
      var row1: u32 = u32(row);
      var col1: u32 = u32(col);
      var row2: u32 = u32(row + 1);
      var col2: u32 = u32(col + 1);
      var channel: u32 = ${r.length>2?`u32(originalIndices[${u}])`:"0"};
      var batch: u32 =  ${r.length>2?`u32(originalIndices[${n}])`:"0"};
      var x11: ${l} = getInputValue(batch, channel, row1, col1);
      var x12: ${l} = getInputValue(batch, channel, row1, col2);
      var x21: ${l} = getInputValue(batch, channel, row2, col1);
      var x22: ${l} = getInputValue(batch, channel, row2, col2);
      var dx1: ${l} = abs(row - ${l}(row1));
      var dx2: ${l} = abs(${l}(row2) - row);
      var dy1: ${l} = abs(col - ${l}(col1));
      var dy2: ${l} = abs(${l}(col2) - col);
      if (row1 == row2) {
        dx1 = 0.5;
        dx2 = 0.5;
      }
      if (col1 == col2) {
        dy1 = 0.5;
        dy2 = 0.5;
      }
      return (x11 * dx2 * dy2 + x12 * dx2 * dy1 + x21 * dx1 * dy2 + x22 * dx1 * dy1);
    }`},tp=(e,t,r,i,a,n,s,o,u,l)=>{let d=r.length===2,[p,h]=d?[0,1]:[2,3],f=e.type.value,m=y=>{let v=y===p?"row":"col";return`
      fn ${v}CubicInterpolation(input_indices: ${e.type.indices}, output_indices: ${t.type.indices}) -> ${f} {
        var output_index = ${t.indicesGet("output_indices",y)};
        var originalIdx: ${f} = getOriginalCoordinateFromResizedCoordinate(output_index, ${a[y]},
        ${i[y]}, ${r[y]}, ${n[y]}, ${n[y]} + ${r.length});
        var fractOriginalIdx: ${f} = originalIdx - floor(originalIdx);
        var coefs = getCubicInterpolationCoefs(fractOriginalIdx);

        if (${o} && (originalIdx < 0 || originalIdx > (${r[y]} - 1))) {
          return ${u};
        }
        var data: array<${f}, 4> = array<${f}, 4>(0.0, 0.0, 0.0, 0.0);
        for (var i: i32 = -1; i < 3; i++) {
          var ${v}: ${f} = originalIdx + ${f}(i);
          if (${v} < 0 || ${v} >= ${r[y]}) {
            ${l?`coefs[i + 1] = 0.0;
                        continue;`:o?`return ${u};`:`${v} = max(0, min(${v}, ${r[y]} - 1));`};
          }
        var input_indices_copy: ${e.type.indices} = input_indices;
          ${e.indicesSet("input_indices_copy",y,`u32(${v})`)};
          data[i + 1] = ${y===p?e.getByIndices("input_indices_copy"):"rowCubicInterpolation(input_indices_copy, output_indices)"};
        }
        return cubicInterpolation1D(data, coefs);
      }`};return`
    ${m(p)};
    ${m(h)};
  fn getCubicInterpolationCoefs(s: ${f}) -> array<${f}, 4> {
    var absS = abs(s);
    var coeffs: array<${f}, 4> = array<${f}, 4>(0.0, 0.0, 0.0, 0.0);
    var oneMinusAbsS: ${f} = 1.0 - absS;
    var twoMinusAbsS: ${f} = 2.0 - absS;
    var onePlusAbsS: ${f} = 1.0 + absS;
    coeffs[0] = ((${s} * onePlusAbsS - 5 * ${s}) * onePlusAbsS + 8 * ${s}) * onePlusAbsS - 4 * ${s};
    coeffs[1] = ((${s} + 2) * absS - (${s} + 3)) * absS * absS + 1;
    coeffs[2] = ((${s} + 2) * oneMinusAbsS - (${s} + 3)) * oneMinusAbsS * oneMinusAbsS + 1;
    coeffs[3] = ((${s} * twoMinusAbsS - 5 * ${s}) * twoMinusAbsS + 8 * ${s}) * twoMinusAbsS - 4 * ${s};
    return coeffs;
  }

  fn cubicInterpolation1D(x: array<${f}, 4>, coefs: array<${f}, 4>) -> ${f} {
    var coefsSum: ${f} = coefs[0] + coefs[1] + coefs[2] + coefs[3];
    return (x[0] * coefs[0] + x[1] * coefs[1]+ x[2] * coefs[2]+ x[3] * coefs[3]) / coefsSum;
  }

  fn bicubicInterpolation(output_indices: ${t.type.indices}) -> ${f} {
    var input_indices: ${e.type.indices} = output_indices;
    return colCubicInterpolation(input_indices, output_indices);
  }
    `},rp=(e,t,r,i,a)=>{let[n,s,o,u,l]=r.length===3?[-1,0,1,2,-1]:[0,2,3,4,1],d=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, depth:u32, height: u32, width: u32) -> ${d} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",s,`max(0, min(depth, ${r[s]} - 1))`)};
      ${e.indicesSet("input_indices",o,`max(0, min(height, ${r[o]} - 1))`)};
      ${e.indicesSet("input_indices",u,`max(0, min(width, ${r[u]} - 1))`)};
      ${Jn(e,l,n,3)}
      return ${e.getByIndices("input_indices")};
    }

    fn trilinearInterpolation(output_indices: ${t.type.indices}) -> ${d} {
      var originalIndices = calculateOriginalIndicesFromOutputIndices(output_indices);
      var depth:${d} = originalIndices[${s}];
      var height:${d} = originalIndices[${o}];
      var width:${d} = originalIndices[${u}];
      ${i?`if (depth < 0 || depth > (${r[s]} - 1) || height < 0 || height > (${r[o]} - 1) || width < 0 || (width > ${r[u]} - 1)) {
      return ${a};
        }`:""};

    depth = max(0, min(depth, ${r[s]} - 1));
      height = max(0, min(height, ${r[o]} - 1));
      width = max(0, min(width, ${r[u]} - 1));
      var depth1: u32 = u32(depth);
      var height1: u32 = u32(height);
      var width1: u32 = u32(width);
      var depth2: u32 = u32(depth + 1);
      var height2: u32 = u32(height + 1);
      var width2: u32 = u32(width + 1);
      var channel: u32 = ${r.length>3?`u32(originalIndices[${l}])`:"0"};
      var batch: u32 =  ${r.length>3?`u32(originalIndices[${n}])`:"0"};

      var x111: ${d} = getInputValue(batch, channel, depth1, height1, width1);
      var x112: ${d} = getInputValue(batch, channel, depth1, height1, width2);
      var x121: ${d} = getInputValue(batch, channel, depth1, height2, width1);
      var x122: ${d} = getInputValue(batch, channel, depth1, height2, width2);
      var x211: ${d} = getInputValue(batch, channel, depth2, height1, width1);
      var x212: ${d} = getInputValue(batch, channel, depth2, height1, width2);
      var x221: ${d} = getInputValue(batch, channel, depth2, height2, width1);
      var x222: ${d} = getInputValue(batch, channel, depth2, height2, width2);
      var dx1: ${d} = abs(depth - ${d}(depth1));
      var dx2: ${d} = abs(${d}(depth2) - depth);
      var dy1: ${d} = abs(height - ${d}(height1));
      var dy2: ${d} = abs(${d}(height2) - height);
      var dz1: ${d} = abs(width - ${d}(width1));
      var dz2: ${d} = abs(${d}(width2) - width);
      if (depth1 == depth2) {
        dx1 = 0.5;
        dx2 = 0.5;
      }
      if (height1 == height2) {
        dy1 = 0.5;
        dy2 = 0.5;
      }
      if (width1 == width2) {
        dz1 = 0.5;
        dz2 = 0.5;
      }
      return (x111 * dx2 * dy2 * dz2 + x112 * dx2 * dy2 * dz1 + x121 * dx2 * dy1 *dz2 + x122 * dx2 * dy1 * dz1 +
              x211 * dx1 * dy2 * dz2 + x212 * dx1 * dy2 * dz1 + x221 * dx1 * dy1 *dz2 + x222 * dx1 * dy1 * dz1);
    }`},ip=(e,t,r,i,a,n)=>{let s=e.dims,o=Kd(n,t.axes,s.length),u=Zd(s,i,a,t.axes),l=i.slice();i.length===0&&(l=s.map((w,S)=>w===0?1:u[S]/w),t.keepAspectRatioPolicy!=="stretch"&&(u=Qd(s,l,t)));let d=Z("output",e.dataType,u.length),p=O("input",e.dataType,s.length),h=U.size(u),f=s.length===u.length&&s.every((w,S)=>w===u[S]),m=t.coordinateTransformMode==="tf_crop_and_resize",y=t.extrapolationValue,v=p.type.value,_=w=>`
      ${f?"":`
      ${Hd(t.coordinateTransformMode,v)};
      ${(()=>{switch(t.mode){case"nearest":return`
              ${Jd(p,s)};
              ${jd(t.nearestMode,r,v)};
              ${Yd(p,d,s,u,l.length,o.length,m)};
              `;case"linear":return`
              ${Xd(d,s,u,l.length,o.length)};
              ${(()=>{if(s.length===2||s.length===4)return`${ep(p,d,s,m,y)}`;if(s.length===3||s.length===5)return`${rp(p,d,s,m,y)}`;throw Error("Linear mode only supports input dims 2, 3, 4 and 5 are supported in linear mode.")})()};
            `;case"cubic":return`
            ${(()=>{if(s.length===2||s.length===4)return`${tp(p,d,s,u,l,o,t.cubicCoeffA,m,t.extrapolationValue,t.excludeOutside)}`;throw Error("Cubic mode only supports input dims 2 and 4 are supported in linear mode.")})()};
            `;default:throw Error("Invalid resize mode")}})()};
      `}
      ${w.registerUniform("output_size","u32").registerUniform("scales","f32",l.length).registerUniform("roi","f32",o.length).declareVariables(p,d)}
      ${w.mainStart()}
        ${w.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
        ${f?"output[global_idx] = input[global_idx];":`
        let output_indices = ${d.offsetToIndices("global_idx")};
        var input_indices: ${p.type.indices};
        ${(()=>{switch(t.mode){case"nearest":return`input_indices = calculateInputIndicesFromOutputIndices(output_indices);
                if (checkInputIndices(input_indices)) {
                  output[global_idx] = ${p.getByIndices("input_indices")};
                } else {
                  output[global_idx] = ${t.extrapolationValue};
                }`;case"linear":return`output[global_idx] = ${s.length===2||s.length===4?"bilinearInterpolation":"trilinearInterpolation"}(output_indices);`;case"cubic":return"output[global_idx] = bicubicInterpolation(output_indices);";default:throw Error(`Unsupported resize mode: ${t.mode}`)}})()};
`}
      }`;return{name:"Resize",shaderCache:{hint:`${t.cacheKey}|${r}|${l.length>0?t.mode==="cubic"?l:l.length:""}|${a.length>0?a:""}|${o.length>0?o:""}|${f}|${t.mode==="nearest"?s.length:s}`,inputDependencies:["rank"]},getShaderSource:_,getRunData:()=>({outputs:[{dims:u,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(h/64)},programUniforms:[{type:12,data:h},{type:1,data:l},{type:1,data:o},...E(s,u)]})}},ap=e=>{let t=e.customDataBuffer;return new Uint32Array(t,t.byteOffset,1)[0]},np=(e,t)=>{let r=[],i=[],a=[],n=ap(e);if(t.antialias!==0)throw Error("Only default value (0) for Antialias attribute is supported");Gd(e.inputs,t,n,r,i,a),e.compute(ip(e.inputs[0],t,n,r,i,a),{inputs:[0]})},sp=e=>{let t=e.antialias,r=e.axes,i=e.coordinateTransformMode,a=e.cubicCoeffA,n=e.excludeOutside!==0,s=e.extrapolationValue,o=e.keepAspectRatioPolicy,u=e.mode,l=e.nearestMode===""?"simple":e.nearestMode;return g({antialias:t,axes:r,coordinateTransformMode:i,cubicCoeffA:a,excludeOutside:n,extrapolationValue:s,keepAspectRatioPolicy:o,mode:u,nearestMode:l})}}),op,up,lp,sh=C(()=>{pe(),ne(),ie(),op=e=>{if(!e||e.length<3)throw new Error("layerNorm requires at least 3 inputs.");let t=e[0],r=e[1],i=e[2];if(t.dataType!==r.dataType||t.dataType!==i.dataType)throw new Error("All inputs must have the same data type");if(t.dims.length!==3&&t.dims.length!==2)throw new Error("Input must be 2D or 3D");if(r.dims.length!==3&&r.dims.length!==2)throw new Error("Skip must be 2D or 3D");let a=t.dims[t.dims.length-1],n=t.dims[t.dims.length-2];if(r.dims[r.dims.length-1]!==a)throw new Error("Skip must have the same hidden size as input");if(r.dims[r.dims.length-2]!==n)throw new Error("Skip must have the same sequence length as input");if(i.dims.length!==1)throw new Error("Gamma must be 1D");if(i.dims[i.dims.length-1]!==a)throw new Error("Gamma must have the same hidden size as input");if(e.length>3){let s=e[3];if(s.dims.length!==1)throw new Error("Beta must be 1D");if(s.dims[s.dims.length-1]!==a)throw new Error("Beta must have the same hidden size as input")}if(e.length>4){let s=e[4];if(s.dims.length!==1)throw new Error("Bias must be 1D");if(s.dims[s.dims.length-1]!==a)throw new Error("Bias must have the same hidden size as input")}},up=(e,t,r,i)=>{let a=t.simplified,n=e[0].dims,s=U.size(n),o=n,u=s,l=n.slice(-1)[0],d=i?n.slice(0,-1).concat(1):[],p=!a&&e.length>3,h=e.length>4,f=i&&r>1,m=i&&r>2,y=r>3,v=64,_=B(l),w=[{type:12,data:u},{type:12,data:_},{type:12,data:l},{type:1,data:t.epsilon}],S=z=>{let D=[{name:"output_size",type:"u32"},{name:"components",type:"u32"},{name:"hidden_size",type:"u32"},{name:"epsilon",type:"f32"}],M=[O("x",e[0].dataType,e[0].dims,_),O("skip",e[1].dataType,e[1].dims,_),O("gamma",e[2].dataType,e[2].dims,_)];p&&M.push(O("beta",e[3].dataType,e[3].dims,_)),h&&M.push(O("bias",e[4].dataType,e[4].dims,_)),M.push(Z("output",e[0].dataType,o,_)),f&&M.push(Z("mean_output",1,d)),m&&M.push(Z("inv_std_output",1,d)),y&&M.push(Z("input_skip_bias_sum",e[0].dataType,o,_));let N=R(e[0].dataType),W=R(1,_);return`

      ${z.registerUniforms(D).declareVariables(...M)}
      var<workgroup> sum_shared : array<${W}, ${v}>;
      var<workgroup> sum_squared_shared : array<${W}, ${v}>;

      ${z.mainStart([v,1,1])}
        let ix = local_id.x;
        let iy = global_id.x / ${v};

        let hidden_size_vectorized: u32 = uniforms.hidden_size / uniforms.components;
        var stride = hidden_size_vectorized / ${v};
        let offset = ix * stride + iy * hidden_size_vectorized;
        let offset1d = stride * ix;
        if (ix == ${v-1}) {
          stride = hidden_size_vectorized - stride * ix;
        }
        for (var i: u32 = 0; i < stride; i++) {
          let skip_value = skip[offset + i];
          let bias_value = ${h?"bias[offset1d + i]":N+"(0.0)"};
          let input_value = x[offset + i];
          let value = input_value + skip_value + bias_value;
          ${y?"input_skip_bias_sum[offset + i] = value;":""}
          output[offset + i] = value;
          let f32_value = ${G(N,_,"value")};
          sum_shared[ix] += f32_value;
          sum_squared_shared[ix] += f32_value * f32_value;
        }
        workgroupBarrier();

        var reduce_size : u32 = ${v};
        for (var curr_size = reduce_size >> 1;  curr_size > 0; curr_size = reduce_size >> 1) {
          reduce_size = curr_size + (reduce_size & 1);
          if (ix < curr_size) {
            sum_shared[ix] += sum_shared[ix + reduce_size];
            sum_squared_shared[ix] += sum_squared_shared[ix + reduce_size];
          }
          workgroupBarrier();
        }

        let sum = sum_shared[0];
        let square_sum = sum_squared_shared[0];
        let mean = ${j("sum",_)} / f32(uniforms.hidden_size);
        let inv_std_dev = inverseSqrt(${j("square_sum",_)} / f32(uniforms.hidden_size) ${a?"":"- mean * mean"} + uniforms.epsilon);
        ${f?"mean_output[global_idx] = mean;":""}
        ${m?"inv_std_output[global_idx] = inv_std_dev;":""}

        for (var i: u32 = 0; i < stride; i++) {
          output[offset + i] = (output[offset + i] ${a?"":`- ${N}(mean)`}) *
            ${N}(inv_std_dev) * gamma[offset1d + i]
            ${p?"+ beta[offset1d + i]":""};
        }
      }`},x=[{dims:o,dataType:e[0].dataType}];return r>1&&x.push({dims:d,dataType:1}),r>2&&x.push({dims:d,dataType:1}),r>3&&x.push({dims:n,dataType:e[0].dataType}),{name:"SkipLayerNormalization",shaderCache:{hint:`${_};${f};${m};${y}`,inputDependencies:e.map((z,D)=>"type")},getShaderSource:S,getRunData:()=>({outputs:x,dispatchGroup:{x:Math.ceil(u/l)},programUniforms:w})}},lp=(e,t)=>{op(e.inputs);let r=[0];e.outputCount>1&&r.push(-3),e.outputCount>2&&r.push(-3),e.outputCount>3&&r.push(3),e.compute(up(e.inputs,t,e.outputCount,!1),{outputs:r})}}),dp,ga,pp,es,cp,hp,fp,mp,oh=C(()=>{pe(),ne(),b(),ie(),dp=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");if(t.axes.length!==0){if(t.axes.length!==t.starts.length||t.axes.length!==t.ends.length)throw new Error("axes, starts and ends must have the same length")}else if(t.starts.length!==t.ends.length)throw new Error("starts and ends must have the same length");e.slice(1).forEach((r,i)=>{if(e[i+1].dataType!==6&&e[i+1].dataType!==7)throw new Error(`Input ${i} must be an array of int32 or int64`)})},ga=(e,t)=>{let r=[];if(e.length>t)if(e[t].dataType===7)e[t].getBigInt64Array().forEach(i=>r.push(Number(i)));else if(e[t].dataType===6)e[t].getInt32Array().forEach(i=>r.push(Number(i)));else throw new Error(`Input ${t} must be an array of int32 or int64`);return r},pp=(e,t)=>{if(e.length>1){let r=ga(e,1),i=ga(e,2),a=ga(e,3);return a.length===0&&(a=[...Array(e[0].dims.length).keys()]),g({starts:r,ends:i,axes:a})}else return t},es=(e,t,r,i,a)=>{let n=e;return e<0&&(n+=r[i[t]]),a[t]<0?Math.max(0,Math.min(n,r[i[t]]-1)):Math.max(0,Math.min(n,r[i[t]]))},cp=(e,t,r)=>`fn calculateInputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
          var input_indices: ${e.type.indices};
          var carry = 0u;
          for (var i = ${r.length-1}; i >= 0; i--) {
            let input_shape_i = ${P("uniforms.input_shape","i",r.length)};
            let steps_i = ${P("uniforms.steps","i",r.length)};
            let signs_i = ${P("uniforms.signs","i",r.length)};
            let starts_i = ${P("uniforms.starts","i",r.length)};
            var output_index = ${t.indicesGet("output_indices","i")};
            var input_index = output_index * steps_i + starts_i + carry;
            carry = input_index / input_shape_i;
            input_index = input_index % input_shape_i;
            if (signs_i < 0) {
              input_index = input_shape_i - input_index - 1u + starts_i;
            }
            ${e.indicesSet("input_indices","i","input_index")};
          }
          return input_indices;
      }`,hp=(e,t)=>{let r=e[0].dims,i=U.size(r),a=t.axes.length>0?U.normalizeAxes(t.axes,r.length):[...Array(r.length).keys()],n=ga(e,4);n.forEach(_=>_!==0||(()=>{throw new Error("step cannot be 0")})),n.length===0&&(n=Array(a.length).fill(1));let s=t.starts.map((_,w)=>es(_,w,r,a,n)),o=t.ends.map((_,w)=>es(_,w,r,a,n));if(a.length!==s.length||a.length!==o.length)throw new Error("start, ends and axes should have the same number of elements");if(a.length!==r.length)for(let _=0;_<r.length;++_)a.includes(_)||(s.splice(_,0,0),o.splice(_,0,r[_]),n.splice(_,0,1));let u=n.map(_=>Math.sign(_));n.forEach((_,w,S)=>{if(_<0){let x=(o[w]-s[w])/_,z=s[w],D=z+x*n[w];s[w]=D,o[w]=z,S[w]=-_}});let l=r.slice(0);a.forEach((_,w)=>{l[_]=Math.ceil((o[_]-s[_])/n[_])});let d={dims:l,dataType:e[0].dataType},p=Z("output",e[0].dataType,l.length),h=O("input",e[0].dataType,e[0].dims.length),f=U.size(l),m=[{name:"outputSize",type:"u32"},{name:"starts",type:"u32",length:s.length},{name:"signs",type:"i32",length:u.length},{name:"steps",type:"u32",length:n.length}],y=[{type:12,data:f},{type:12,data:s},{type:6,data:u},{type:12,data:n},...E(e[0].dims,l)],v=_=>`
      ${_.registerUniforms(m).declareVariables(h,p)}
        ${cp(h,p,r)}
        ${_.mainStart()}
          ${_.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
          let output_indices = ${p.offsetToIndices("global_idx")};
          let input_indices = calculateInputIndices(output_indices);
          ${p.setByOffset("global_idx",h.getByIndices("input_indices"))}
      }`;return{name:"Slice",shaderCache:{hint:`${u.length}_${s.length}_${n.length}`,inputDependencies:["rank"]},getShaderSource:v,getRunData:()=>({outputs:[d],dispatchGroup:{x:Math.ceil(i/64)},programUniforms:y})}},fp=(e,t)=>{dp(e.inputs,t);let r=pp(e.inputs,t);e.compute(hp(e.inputs,r),{inputs:[0]})},mp=e=>{let t=e.starts,r=e.ends,i=e.axes;return g({starts:t,ends:r,axes:i})}}),gp,yp,wp,_p,uh=C(()=>{pe(),ne(),b(),at(),ie(),gp=e=>{if(!e||e.length!==1)throw new Error("Softmax op requires 1 input.")},yp=(e,t)=>{let r=e.inputs[0],i=r.dims,a=U.size(i),n=i.length,s=U.normalizeAxis(t.axis,n),o=s<i.length-1,u,l=[];o?(l=Array.from({length:n},(M,N)=>N),l[s]=n-1,l[n-1]=s,u=e.compute(ct(r,l),{inputs:[r],outputs:[-1]})[0]):u=r;let d=u.dims,p=d[n-1],h=a/p,f=B(p),m=p/f,y=64;h===1&&(y=256);let v=(M,N)=>N===4?`max(max(${M}.x, ${M}.y), max(${M}.z, ${M}.w))`:N===2?`max(${M}.x, ${M}.y)`:N===3?`max(max(${M}.x, ${M}.y), ${M}.z)`:M,_=O("x",u.dataType,u.dims,f),w=Z("result",u.dataType,u.dims,f),S=_.type.value,x=R(u.dataType)==="f32"?`var threadMax = ${S}(-3.402823e+38f);`:`var threadMax = ${S}(-65504.0h);`,z=M=>`
      var<workgroup> rowMaxShared : ${S};
      var<workgroup> rowSumShared : ${S};
      var<workgroup> threadShared : array<${S}, ${y}>;

      fn getValue(row: i32, col: i32, row_stride: i32) -> ${S} {
        let index = row * row_stride + col;
        return x[index];
      }

      fn setValue(row: i32, col: i32, row_stride: i32, value: ${S}) {
        let index = row * row_stride + col;
        result[index] = value;
      }
      ${M.registerUniform("packedCols","i32").declareVariables(_,w)}
      ${M.mainStart(y)}
        let gindex = i32(global_idx);
        let lindex = i32(local_idx);
        const wg = ${y};
        let row = gindex / wg;
        let cols = uniforms.packedCols;
        let row_stride : i32 = uniforms.packedCols;

        // find the rows max
        ${x}
        for (var col = lindex; col < cols; col += wg) {
          let value = getValue(row, col, row_stride);
          threadMax = max(threadMax, value);
        }
        if (lindex < cols) {
          threadShared[lindex] = threadMax;
        }
        workgroupBarrier();

        var reduceSize = min(cols, wg);
        for (var currSize = reduceSize >> 1;  currSize > 0; currSize = reduceSize >> 1) {
          reduceSize = currSize + (reduceSize & 1);
          if (lindex < currSize) {
            threadShared[lindex] = max(threadShared[lindex], threadShared[lindex + reduceSize]);
          }
          workgroupBarrier();
        }
        if (lindex == 0) {
          rowMaxShared = ${S}(${v("threadShared[0]",f)});
        }
        workgroupBarrier();

        // find the rows sum
        var threadSum = ${S}(0.0);
        for (var col = lindex; col < cols; col += wg) {
          let subExp = exp(getValue(row, col, row_stride) - rowMaxShared);
          threadSum += subExp;
        }
        threadShared[lindex] = threadSum;
        workgroupBarrier();

        for (var currSize = wg >> 1;  currSize > 0; currSize = currSize >> 1) {
          if (lindex < currSize) {
            threadShared[lindex] = threadShared[lindex] + threadShared[lindex + currSize];
          }
          workgroupBarrier();
        }
        if (lindex == 0) {
          rowSumShared = ${S}(${j("threadShared[0]",f)});
        }
        workgroupBarrier();

        // calculate final value for each element in the row
        for (var col = lindex; col < cols; col += wg) {
          var value = exp(getValue(row, col, row_stride) - rowMaxShared) / rowSumShared;
          // max operation protects against NaN since all values should be >=0
          value = max(value, ${S}(0.0));
          setValue(row, col, row_stride, value);
        }
      }`,D=e.compute({name:"Softmax",shaderCache:{hint:`${f};${y}`,inputDependencies:["type"]},getRunData:()=>({outputs:[{dims:d,dataType:u.dataType}],dispatchGroup:{x:h},programUniforms:[{type:6,data:m}]}),getShaderSource:z},{inputs:[u],outputs:[o?-1:0]})[0];o&&e.compute(ct(D,l),{inputs:[D]})},wp=(e,t)=>{gp(e.inputs),yp(e,t)},_p=e=>g({axis:e.axis})}),ts,bp,vp,$p,xp,lh=C(()=>{pe(),ne(),ie(),ts=e=>Array.from(e.getBigInt64Array(),Number),bp=e=>{if(!e||e.length!==2)throw new Error("Tile requires 2 inputs.");if(e[0].dataType!==1&&e[0].dataType!==10&&e[0].dataType!==6&&e[0].dataType!==12)throw new Error("Tile only support float, float16, int32, and uint32 data types");if(e[1].dataType!==7)throw new Error("Tile `repeats` input should be of int64 data type");if(e[1].dims.length!==1)throw new Error("Tile `repeats` input should be 1-D");if(ts(e[1]).length!==e[0].dims.length)throw new Error("Tile `repeats` input should have same number of elements as rank of input data tensor")},vp=(e,t)=>{let r=[];for(let i=0;i<e.length;++i)r.push(e[i]*t[i]);return r},$p=(e,t)=>{let r=e[0].dims,i=t??ts(e[1]),a=vp(r,i),n=U.size(a),s=e[0].dataType,o=O("input",s,r.length),u=Z("output",s,a.length),l=d=>`
      const inputShape = ${o.indices(...r)};
      ${d.registerUniform("output_size","u32").declareVariables(o,u)}
      ${d.mainStart()}
      ${d.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let output_indices = ${u.offsetToIndices("global_idx")};
      var input_indices: ${o.type.indices};
      for (var i = 0; i < ${r.length}; i++) {
        let input_dim_i = ${o.indicesGet("uniforms.input_shape","i")};
        let input_dim_value = ${u.indicesGet("output_indices","i")}  % input_dim_i;

        ${o.indicesSet("input_indices","i","input_dim_value")}
      }
      ${u.setByOffset("global_idx",o.getByIndices("input_indices"))}
    }`;return{name:"Tile",shaderCache:{hint:`${i}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:a,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:[{type:12,data:n},...E(e[0].dims,a)]}),getShaderSource:l}},xp=e=>{bp(e.inputs),e.compute($p(e.inputs),{inputs:[0]})}}),Sp,Tp,Ep,dh=C(()=>{pe(),ne(),ie(),Sp=(e,t,r,i,a)=>{let n=Z("output_data",a,r.length,4),s=O("a_data",t[1].dataType,t[1].dims.length,4),o=O("b_data",t[2].dataType,t[2].dims.length,4),u=O("c_data",t[0].dataType,t[0].dims.length,4),l,d=(p,h,f)=>`select(${h}, ${p}, ${f})`;if(!i)l=n.setByOffset("global_idx",d(s.getByOffset("global_idx"),o.getByOffset("global_idx"),u.getByOffset("global_idx")));else{let p=(h,f,m="")=>{let y=`a_data[index_a${f}][component_a${f}]`,v=`b_data[index_b${f}][component_b${f}]`,_=`bool(c_data[index_c${f}] & (0xffu << (component_c${f} * 8)))`;return`
            let output_indices${f} = ${n.offsetToIndices(`global_idx * 4u + ${f}u`)};
            let offset_a${f} = ${s.broadcastedIndicesToOffset(`output_indices${f}`,n)};
            let offset_b${f} = ${o.broadcastedIndicesToOffset(`output_indices${f}`,n)};
            let offset_c${f} = ${u.broadcastedIndicesToOffset(`output_indices${f}`,n)};
            let index_a${f} = offset_a${f} / 4u;
            let index_b${f} = offset_b${f} / 4u;
            let index_c${f} = offset_c${f} / 4u;
            let component_a${f} = offset_a${f} % 4u;
            let component_b${f} = offset_b${f} % 4u;
            let component_c${f} = offset_c${f} % 4u;
            ${h}[${f}] = ${m}(${d(y,v,_)});
          `};a===9?l=`
            var data = vec4<u32>(0);
            ${p("data",0,"u32")}
            ${p("data",1,"u32")}
            ${p("data",2,"u32")}
            ${p("data",3,"u32")}
            output_data[global_idx] = dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(data));`:l=`
            ${p("output_data[global_idx]",0)}
            ${p("output_data[global_idx]",1)}
            ${p("output_data[global_idx]",2)}
            ${p("output_data[global_idx]",3)}
          `}return`
        ${e.registerUniform("vec_size","u32").declareVariables(u,s,o,n)}
        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${l}
      }`},Tp=e=>{let t=e[1].dims,r=e[2].dims,i=e[0].dims,a=e[1].dataType,n=!(U.areEqual(t,r)&&U.areEqual(r,i)),s=t,o=U.size(t);if(n){let l=Zt.calcShape(Zt.calcShape(t,r,!1),i,!1);if(!l)throw new Error("Can't perform where op on the given tensors");s=l,o=U.size(s)}let u=Math.ceil(o/4);return{name:"Where",shaderCache:{inputDependencies:["rank","rank","rank"]},getShaderSource:l=>Sp(l,e,s,n,a),getRunData:()=>({outputs:[{dims:s,dataType:a}],dispatchGroup:{x:Math.ceil(o/64/4)},programUniforms:[{type:12,data:u},...E(i,t,r,s)]})}},Ep=e=>{e.compute(Tp(e.inputs))}}),Ip,ph=C(()=>{Tc(),yn(),Ec(),Ic(),kc(),Cc(),Ac(),Mc(),Pc(),Uc(),Nc(),Lc(),Vc(),Wc(),Fc(),qc(),Gc(),Hc(),jc(),Kc(),Zc(),Qc(),Xc(),Yc(),Jc(),Nl(),eh(),th(),rh(),ih(),ah(),fn(),nh(),Zl(),sh(),oh(),uh(),Hl(),lh(),at(),vn(),dh(),Ip=new Map([["Abs",[so]],["Acos",[oo]],["Acosh",[uo]],["Add",[Qo]],["ArgMax",[Gs,gn]],["ArgMin",[qs,gn]],["Asin",[lo]],["Asinh",[po]],["Atan",[co]],["Atanh",[ho]],["Attention",[Xs]],["AveragePool",[Td,Sd]],["BatchNormalization",[to]],["BiasAdd",[ao]],["BiasSplitGelu",[jo]],["Cast",[mo,fo]],["Ceil",[wo]],["Clip",[yo]],["Concat",[du,pu]],["Conv",[Bn,On]],["ConvTranspose",[Uu,Mu]],["Cos",[_o]],["Cosh",[bo]],["CumSum",[Lu,Vu]],["DepthToSpace",[Gu,Hu]],["DequantizeLinear",[Bd,Md]],["Div",[Xo]],["Einsum",[Yu,Ju]],["Elu",[vo,da]],["Equal",[Yo]],["Erf",[$o]],["Exp",[xo]],["Expand",[il]],["FastGelu",[nl]],["Floor",[So]],["FusedConv",[Bn,On]],["Gather",[ll,ul]],["GatherElements",[bl,_l]],["GatherBlockQuantized",[ml,gl]],["GatherND",[pl,cl]],["Gelu",[To]],["Gemm",[Sl,xl]],["GlobalAveragePool",[Id,Ed]],["GlobalMaxPool",[zd,Ad]],["Greater",[ru]],["GreaterOrEqual",[au]],["GridSample",[Rl,Bl]],["GroupQueryAttention",[Jl]],["HardSigmoid",[Ro,Oo]],["InstanceNormalization",[rd]],["LayerNormalization",[nd]],["LeakyRelu",[Eo,da]],["Less",[iu]],["LessOrEqual",[nu]],["Log",[Vo]],["MatMul",[od]],["MatMulNBits",[pd,cd]],["MaxPool",[kd,Cd]],["Mul",[Jo]],["MultiHeadAttention",[Ul,Dl]],["Neg",[ko]],["Not",[Io]],["Pad",[vd]],["Pow",[eu]],["QuickGelu",[qo,da]],["Range",[Ud]],["Reciprocal",[Co]],["ReduceMin",[Ns]],["ReduceMean",[Bs]],["ReduceMax",[Us]],["ReduceSum",[Vs]],["ReduceProd",[Ls]],["ReduceL1",[Ms]],["ReduceL2",[Ds]],["ReduceLogSum",[Fs]],["ReduceLogSumExp",[Ps]],["ReduceSumSquare",[Ws]],["Relu",[Ao]],["Resize",[np,sp]],["RotaryEmbedding",[Kl]],["ScatterND",[Wd,Vd]],["Sigmoid",[zo]],["Sin",[Bo]],["Sinh",[Mo]],["Slice",[fp,mp]],["SkipLayerNormalization",[lp]],["Split",[ql,Gl]],["Sqrt",[Do]],["Softmax",[wp,_p]],["Sub",[tu]],["Tan",[Po]],["Tanh",[Uo]],["ThresholdedRelu",[Lo,da]],["Tile",[xp]],["Transpose",[oa,It]],["Where",[Ep]]])}),kp,ch=C(()=>{Je(),Et(),ie(),kp=class{constructor(e){this.backend=e,this.repo=new Map,this.attributesBound=!1}getArtifact(e){return this.repo.get(e)}setArtifact(e,t){this.repo.set(e,t)}run(e,t,r,i,a){et(e.programInfo.name);let n=this.backend.device,s=this.backend.getComputePassEncoder();this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2);let o=[];for(let l of t)o.push({binding:o.length,resource:{buffer:l.buffer}});for(let l of r)o.push({binding:o.length,resource:{buffer:l.buffer}});a&&o.push({binding:o.length,resource:a});let u=n.createBindGroup({layout:e.computePipeline.getBindGroupLayout(0),entries:o,label:e.programInfo.name});if(this.backend.sessionStatus==="capturing"){let l={kernelId:this.backend.currentKernelId,computePipeline:e.computePipeline,bindGroup:u,dispatchGroup:i};this.backend.capturedCommandList.get(this.backend.currentSessionId).push(l)}s.setPipeline(e.computePipeline),s.setBindGroup(0,u),s.dispatchWorkgroups(...i),this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2+1),this.backend.pendingDispatchNumber++,(this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber||this.backend.queryType==="at-passes")&&this.backend.endComputePass(),this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber&&this.backend.flush(),Ye(e.programInfo.name)}dispose(){}build(e,t){et(e.name);let r=this.backend.device,i=[];[{feature:"shader-f16",extension:"f16"},{feature:"subgroups",extension:"subgroups"}].forEach(l=>{r.features.has(l.feature)&&i.push(`enable ${l.extension};`)});let a=Me(t,this.backend.device.limits),n=e.getShaderSource(a),s=`${i.join(`
`)}
${a.additionalImplementations}
${n}`,o=r.createShaderModule({code:s,label:e.name});Te("verbose",()=>`[WebGPU] ${e.name} shader code: ${s}`);let u=r.createComputePipeline({compute:{module:o,entryPoint:"main"},layout:"auto",label:e.name});return Ye(e.name),{programInfo:e,computePipeline:u,uniformVariablesInfo:a.variablesInfo}}normalizeDispatchGroupSize(e){let t=typeof e=="number"?e:e.x,r=typeof e=="number"?1:e.y||1,i=typeof e=="number"?1:e.z||1,a=this.backend.device.limits.maxComputeWorkgroupsPerDimension;if(t<=a&&r<=a&&i<=a)return[t,r,i];let n=t*r*i,s=Math.ceil(Math.sqrt(n));if(s>a){if(s=Math.ceil(Math.cbrt(n)),s>a)throw new Error("Total dispatch size exceeds WebGPU maximum.");return[s,s,s]}else return[s,s,1]}}}),Cp={};ge(Cp,{WebGpuBackend:()=>Rp});var Ap,zp,Op,Rp,hh=C(()=>{Je(),pe(),Et(),dr(),cn(),ph(),ch(),Ap=(e,t)=>{if(t.length!==e.length)throw new Error(`inputDependencies length ${t.length} is not equal to inputTensors length ${e.length}.`);let r=[];for(let i=0;i<e.length;++i){let a=e[i].dataType;switch(t[i]){case"none":{r.push("");break}case"type":{r.push(`${a}`);break}case"rank":{let n=e[i].dims.length;r.push(`${a};${n}`);break}case"dims":{let n=e[i].dims.join(",");r.push(`${a};${n}`);break}default:throw new Error(`unsupported input dependency: ${t[i]}`)}}return r.join("|")},zp=(e,t,r)=>{var a,n;let i=e.name;return(a=e.shaderCache)!=null&&a.hint&&(i+="["+e.shaderCache.hint+"]"),i+=":"+r+`:${Ap(t,((n=e.shaderCache)==null?void 0:n.inputDependencies)??new Array(t.length).fill("dims"))}`,i},Op=class{constructor(e){e&&(this.architecture=e.architecture,this.vendor=e.vendor)}isArchitecture(e){return this.architecture===e}isVendor(e){return this.vendor===e}},Rp=class{constructor(){this.currentSessionId=null,this.currentKernelId=null,this.commandEncoder=null,this.computePassEncoder=null,this.maxDispatchNumber=16,this.pendingDispatchNumber=0,this.pendingKernels=[],this.pendingQueries=new Map,this.sessionStatus="default",this.capturedCommandList=new Map,this.capturedPendingKernels=new Map,this.sessionExternalDataMapping=new Map}get currentKernelCustomData(){if(this.currentKernelId===null)throw new Error("currentKernelCustomData(): currentKernelId is null. (should not happen)");let e=this.kernelCustomData.get(this.currentKernelId);return e||(e={},this.kernelCustomData.set(this.currentKernelId,e)),e}async initialize(e,t){this.env=e;let r=[],i={requiredLimits:{maxComputeWorkgroupStorageSize:t.limits.maxComputeWorkgroupStorageSize,maxComputeWorkgroupsPerDimension:t.limits.maxComputeWorkgroupsPerDimension,maxStorageBufferBindingSize:t.limits.maxStorageBufferBindingSize,maxBufferSize:t.limits.maxBufferSize,maxComputeInvocationsPerWorkgroup:t.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupSizeX:t.limits.maxComputeWorkgroupSizeX,maxComputeWorkgroupSizeY:t.limits.maxComputeWorkgroupSizeY,maxComputeWorkgroupSizeZ:t.limits.maxComputeWorkgroupSizeZ},requiredFeatures:r},a=n=>t.features.has(n)&&r.push(n)&&!0;a("chromium-experimental-timestamp-query-inside-passes")||a("timestamp-query"),a("shader-f16"),a("subgroups"),this.device=await t.requestDevice(i),this.adapterInfo=new Op(t.info||await t.requestAdapterInfo()),this.gpuDataManager=Aa(this),this.programManager=new kp(this),this.kernels=new Map,this.kernelPersistentData=new Map,this.kernelCustomData=new Map,ui(e.logLevel,!!e.debug),this.device.onuncapturederror=n=>{n.error instanceof GPUValidationError&&console.error(`An uncaught WebGPU validation error was raised: ${n.error.message}`)},Object.defineProperty(this.env.webgpu,"device",{value:this.device,writable:!1,enumerable:!0,configurable:!1}),Object.defineProperty(this.env.webgpu,"adapter",{value:t,writable:!1,enumerable:!0,configurable:!1}),this.setQueryType()}dispose(){typeof this.querySet<"u"&&this.querySet.destroy(),this.gpuDataManager.dispose()}getCommandEncoder(){return this.commandEncoder||(this.commandEncoder=this.device.createCommandEncoder()),this.commandEncoder}getComputePassEncoder(){if(!this.computePassEncoder){let e=this.getCommandEncoder(),t={};this.queryType==="at-passes"&&(t.timestampWrites={querySet:this.querySet,beginningOfPassWriteIndex:this.pendingDispatchNumber*2,endOfPassWriteIndex:this.pendingDispatchNumber*2+1}),this.computePassEncoder=e.beginComputePass(t)}return this.computePassEncoder}endComputePass(){this.computePassEncoder&&(this.computePassEncoder.end(),this.computePassEncoder=null)}flush(){if(!this.commandEncoder)return;et(),this.endComputePass();let e;this.queryType!=="none"&&(this.commandEncoder.resolveQuerySet(this.querySet,0,this.pendingDispatchNumber*2,this.queryResolveBuffer,0),e=this.device.createBuffer({size:this.pendingDispatchNumber*2*8,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),this.pendingQueries.set(e,this.pendingKernels),this.pendingKernels=[],this.commandEncoder.copyBufferToBuffer(this.queryResolveBuffer,0,e,0,this.pendingDispatchNumber*2*8)),this.device.queue.submit([this.commandEncoder.finish()]),this.gpuDataManager.refreshPendingBuffers(),this.commandEncoder=null,this.pendingDispatchNumber=0,this.queryType!=="none"&&e.mapAsync(GPUMapMode.READ).then(()=>{var i;let t=new BigUint64Array(e.getMappedRange()),r=this.pendingQueries.get(e);for(let a=0;a<t.length/2;a++){let n=r[a],s=n.kernelId,o=this.kernels.get(s),u=o.kernelType,l=o.kernelName,d=n.programName,p=n.inputTensorViews,h=n.outputTensorViews,f=t[a*2],m=t[a*2+1];typeof this.queryTimeBase>"u"&&(this.queryTimeBase=f);let y=Number(f-this.queryTimeBase),v=Number(m-this.queryTimeBase);if(!Number.isSafeInteger(y)||!Number.isSafeInteger(v))throw new RangeError("incorrect timestamp range");if((i=this.env.webgpu.profiling)!=null&&i.ondata)this.env.webgpu.profiling.ondata({version:1,inputsMetadata:p.map(_=>({dims:_.dims,dataType:$t(_.dataType)})),outputsMetadata:h.map(_=>({dims:_.dims,dataType:$t(_.dataType)})),kernelId:s,kernelType:u,kernelName:l,programName:d,startTime:y,endTime:v});else{let _="";p.forEach((S,x)=>{_+=`input[${x}]: [${S.dims}] | ${$t(S.dataType)}, `});let w="";h.forEach((S,x)=>{w+=`output[${x}]: [${S.dims}] | ${$t(S.dataType)}, `}),console.log(`[profiling] kernel "${s}|${u}|${l}|${d}" ${_}${w}start time: ${y} ns, execution time: ${v-y} ns`)}jt("GPU",`${d}::${f}::${m}`)}e.unmap(),this.pendingQueries.delete(e)}),Ye()}run(e,t,r,i,a,n){et(e.name);let s=[];for(let w=0;w<t.length;++w){let S=t[w].data;if(S===0)continue;let x=this.gpuDataManager.get(S);if(!x)throw new Error(`no GPU data for input: ${S}`);s.push(x)}let{outputs:o,dispatchGroup:u,programUniforms:l}=e.getRunData(t),d=r.length===0?o.map((w,S)=>S):r;if(d.length!==o.length)throw new Error(`Output size ${d.length} must be equal to ${o.length}.`);let p=[],h=[];for(let w=0;w<o.length;++w){if(!Number.isInteger(d[w])||d[w]<-3||d[w]>=n)throw new Error(`Invalid output index: ${d[w]}`);if(d[w]===-3)continue;let S=d[w]===-1,x=d[w]===-2,z=S||x?a(o[w].dataType,o[w].dims):i(d[w],o[w].dataType,o[w].dims);if(p.push(z),z.data===0)continue;let D=this.gpuDataManager.get(z.data);if(!D)throw new Error(`no GPU data for output: ${z.data}`);if(S&&this.temporaryData.push(D),x){let M=this.kernelPersistentData.get(this.currentKernelId);M||(M=[],this.kernelPersistentData.set(this.currentKernelId,M)),M.push(D)}h.push(D)}if(s.length!==t.length||h.length!==p.length){if(h.length===0)return Ye(e.name),p;throw new Error(`Program ${e.name} has zero-sized tensor(s) in inputs or outputs. This is not supported now.`)}let f;if(l){let w=0,S=[];l.forEach(M=>{let N=typeof M.data=="number"?[M.data]:M.data;if(N.length===0)return;let W=M.type===10?2:4,Q,de;M.type===10?(de=N.length>4?16:N.length>2?8:N.length*W,Q=N.length>4?16:W*N.length):(de=N.length<=2?N.length*W:16,Q=16),w=Math.ceil(w/de)*de,S.push(w);let te=M.type===10?8:4;w+=N.length>4?Math.ceil(N.length/te)*Q:N.length*W});let x=16;w=Math.ceil(w/x)*x;let z=new ArrayBuffer(w);l.forEach((M,N)=>{let W=S[N],Q=typeof M.data=="number"?[M.data]:M.data;if(M.type===6)new Int32Array(z,W,Q.length).set(Q);else if(M.type===12)new Uint32Array(z,W,Q.length).set(Q);else if(M.type===10)new Uint16Array(z,W,Q.length).set(Q);else if(M.type===1)new Float32Array(z,W,Q.length).set(Q);else throw new Error(`Unsupported uniform type: ${$t(M.type)}`)});let D=this.gpuDataManager.create(w,GPUBufferUsage.COPY_DST|GPUBufferUsage.UNIFORM);this.device.queue.writeBuffer(D.buffer,0,z,0,w),this.gpuDataManager.release(D.id),f={offset:0,size:w,buffer:D.buffer}}let m=this.programManager.normalizeDispatchGroupSize(u),y=m[1]===1&&m[2]===1,v=zp(e,t,y),_=this.programManager.getArtifact(v);if(_||(_=this.programManager.build(e,m),this.programManager.setArtifact(v,_),Te("info",()=>`[artifact] key: ${v}, programName: ${e.name}`)),l&&_.uniformVariablesInfo){if(l.length!==_.uniformVariablesInfo.length)throw new Error(`Uniform variables count mismatch: expect ${_.uniformVariablesInfo.length}, got ${l.length} in program "${_.programInfo.name}".`);for(let w=0;w<l.length;w++){let S=l[w],x=S.type,z=typeof S.data=="number"?1:S.data.length,[D,M]=_.uniformVariablesInfo[w];if(x!==D||z!==M)throw new Error(`Uniform variable ${w} mismatch: expect type ${D} with size ${M}, got type ${x} with size ${z} in program "${_.programInfo.name}".`)}}if(Te("info",()=>`[ProgramManager] run "${e.name}" (key=${v}) with ${m[0]}x${m[1]}x${m[2]}`),this.queryType!=="none"||this.sessionStatus==="capturing"){let w={kernelId:this.currentKernelId,programName:_.programInfo.name,inputTensorViews:t,outputTensorViews:p};this.pendingKernels.push(w),this.sessionStatus==="capturing"&&this.capturedPendingKernels.get(this.currentSessionId).push(w)}return this.programManager.run(_,s,h,m,f),Ye(e.name),p}upload(e,t){this.gpuDataManager.upload(e,t)}memcpy(e,t){this.gpuDataManager.memcpy(e,t)}async download(e,t){await this.gpuDataManager.download(e,t)}alloc(e){return this.gpuDataManager.create(e).id}free(e){return this.gpuDataManager.release(e)}createKernel(e,t,r,i){let a=Ip.get(e);if(!a)throw new Error(`kernel not implemented: ${e}`);let n={kernelType:e,kernelName:i,kernelEntry:a[0],attributes:[a[1],r]};this.kernels.set(t,n)}releaseKernel(e){let t=this.kernelPersistentData.get(e);if(t){for(let r of t)this.gpuDataManager.release(r.id);this.kernelPersistentData.delete(e)}this.kernelCustomData.delete(e),this.kernels.delete(e)}computeKernel(e,t,r){let i=this.kernels.get(e);if(!i)throw new Error(`kernel not created: ${e}`);let a=i.kernelType,n=i.kernelName,s=i.kernelEntry,o=i.attributes;if(this.currentKernelId!==null)throw new Error(`kernel "[${a}] ${n}" is not allowed to be called recursively`);this.currentKernelId=e,o[0]&&(o[1]=o[0](o[1]),o[0]=void 0),Te("info",()=>`[WebGPU] Start to run kernel "[${a}] ${n}"...`);let u=this.env.debug;this.temporaryData=[];try{return u&&this.device.pushErrorScope("validation"),s(t,o[1]),0}catch(l){return r.push(Promise.resolve(`[WebGPU] Kernel "[${a}] ${n}" failed. ${l}`)),1}finally{u&&r.push(this.device.popErrorScope().then(l=>l?`GPU validation error for kernel "[${a}] ${n}": ${l.message}`:null));for(let l of this.temporaryData)this.gpuDataManager.release(l.id);this.temporaryData=[],this.currentKernelId=null}}registerBuffer(e,t,r,i){let a=this.sessionExternalDataMapping.get(e);a||(a=new Map,this.sessionExternalDataMapping.set(e,a));let n=a.get(t),s=this.gpuDataManager.registerExternalBuffer(r,i,n);return a.set(t,[s,r]),s}unregisterBuffers(e){let t=this.sessionExternalDataMapping.get(e);t&&(t.forEach(r=>this.gpuDataManager.unregisterExternalBuffer(r[0])),this.sessionExternalDataMapping.delete(e))}getBuffer(e){let t=this.gpuDataManager.get(e);if(!t)throw new Error(`no GPU data for buffer: ${e}`);return t.buffer}createDownloader(e,t,r){return async()=>{let i=await na(this,e,t);return Qt(i.buffer,r)}}writeTimestamp(e){this.queryType==="inside-passes"&&this.computePassEncoder.writeTimestamp(this.querySet,e)}setQueryType(){var e;this.queryType="none",(((e=this.env.webgpu.profiling)==null?void 0:e.mode)==="default"||(typeof this.env.trace>"u"?this.env.wasm.trace:this.env.trace))&&(this.device.features.has("chromium-experimental-timestamp-query-inside-passes")?this.queryType="inside-passes":this.device.features.has("timestamp-query")&&(this.queryType="at-passes"),this.queryType!=="none"&&typeof this.querySet>"u"&&(this.querySet=this.device.createQuerySet({type:"timestamp",count:this.maxDispatchNumber*2}),this.queryResolveBuffer=this.device.createBuffer({size:this.maxDispatchNumber*2*8,usage:GPUBufferUsage.COPY_SRC|GPUBufferUsage.QUERY_RESOLVE})))}captureBegin(){Te("info","captureBegin"),this.capturedCommandList.get(this.currentSessionId)||this.capturedCommandList.set(this.currentSessionId,[]),this.capturedPendingKernels.get(this.currentSessionId)||this.capturedPendingKernels.set(this.currentSessionId,[]),this.flush(),this.sessionStatus="capturing"}captureEnd(){Te("info","captureEnd"),this.flush(),this.sessionStatus="default"}replay(){Te("info","replay"),this.sessionStatus="replaying";let e=this.capturedCommandList.get(this.currentSessionId),t=this.capturedPendingKernels.get(this.currentSessionId),r=e.length;this.pendingKernels=[];for(let i=0;i<r;i++){let a=this.getComputePassEncoder(),n=e[i];this.writeTimestamp(this.pendingDispatchNumber*2),a.setPipeline(n.computePipeline),a.setBindGroup(0,n.bindGroup),a.dispatchWorkgroups(...n.dispatchGroup),this.writeTimestamp(this.pendingDispatchNumber*2+1),this.pendingDispatchNumber++,this.queryType!=="none"&&this.pendingKernels.push(t[i]),(this.pendingDispatchNumber>=this.maxDispatchNumber||this.queryType==="at-passes")&&this.endComputePass(),this.pendingDispatchNumber>=this.maxDispatchNumber&&this.flush()}this.flush(),this.sessionStatus="default"}onCreateSession(){this.gpuDataManager.onCreateSession()}onReleaseSession(e){this.unregisterBuffers(e),this.capturedCommandList.has(e)&&this.capturedCommandList.delete(e),this.capturedPendingKernels.has(e)&&this.capturedPendingKernels.delete(e),this.gpuDataManager.onReleaseSession(e)}onRunStart(e){this.currentSessionId=e,this.setQueryType()}}}),Bp={};ge(Bp,{init:()=>Dp});var Fa,Mp,Dp,fh=C(()=>{pe(),Et(),ne(),aa(),Fa=class fc{constructor(t,r,i,a){this.module=t,this.dataType=r,this.data=i,this.dims=a}getFloat32Array(){if(this.dataType!==1)throw new Error("Invalid data type");let t=U.size(this.dims);return t===0?new Float32Array:new Float32Array(this.module.HEAP8.buffer,this.data,t)}getBigInt64Array(){if(this.dataType!==7)throw new Error("Invalid data type");let t=U.size(this.dims);return t===0?new BigInt64Array:new BigInt64Array(this.module.HEAP8.buffer,this.data,t)}getInt32Array(){if(this.dataType!==6)throw new Error("Invalid data type");let t=U.size(this.dims);return t===0?new Int32Array:new Int32Array(this.module.HEAP8.buffer,this.data,t)}getUint16Array(){if(this.dataType!==10&&this.dataType!==4)throw new Error("Invalid data type");let t=U.size(this.dims);return t===0?new Uint16Array:new Uint16Array(this.module.HEAP8.buffer,this.data,t)}reshape(t){if(U.size(t)!==U.size(this.dims))throw new Error("Invalid new shape");return new fc(this.module,this.dataType,this.data,t)}},Mp=class{constructor(e,t,r){this.module=e,this.backend=t,this.customDataOffset=0,this.customDataSize=0,this.adapterInfo=t.adapterInfo;let i=e.PTR_SIZE,a=r/e.PTR_SIZE,n=i===4?"i32":"i64";this.opKernelContext=Number(e.getValue(i*a++,n));let s=Number(e.getValue(i*a++,n));this.outputCount=Number(e.getValue(i*a++,n)),this.customDataOffset=Number(e.getValue(i*a++,"*")),this.customDataSize=Number(e.getValue(i*a++,n));let o=[];for(let u=0;u<s;u++){let l=Number(e.getValue(i*a++,n)),d=Number(e.getValue(i*a++,"*")),p=Number(e.getValue(i*a++,n)),h=[];for(let f=0;f<p;f++)h.push(Number(e.getValue(i*a++,n)));o.push(new Fa(e,l,d,h))}this.inputs=o}get kernelCustomData(){return this.backend.currentKernelCustomData}get customDataBuffer(){return this.module.HEAPU8.subarray(this.customDataOffset,this.customDataOffset+this.customDataSize)}compute(e,t){var s;let r=((s=t==null?void 0:t.inputs)==null?void 0:s.map(o=>typeof o=="number"?this.inputs[o]:o))??this.inputs,i=(t==null?void 0:t.outputs)??[],a=(o,u,l)=>new Fa(this.module,u,this.output(o,l),l),n=(o,u)=>{let l=xt(o,u);if(!l)throw new Error(`Unsupported data type: ${o}`);let d=l>0?this.backend.gpuDataManager.create(l).id:0;return new Fa(this.module,o,d,u)};return this.backend.run(e,r,i,a,n,this.outputCount)}output(e,t){let r=this.module.stackSave();try{let i=this.module.PTR_SIZE,a=i===4?"i32":"i64",n=this.module.stackAlloc((1+t.length)*i);this.module.setValue(n,t.length,a);for(let s=0;s<t.length;s++)this.module.setValue(n+i*(s+1),t[s],a);return this.module._JsepOutput(this.opKernelContext,e,n)}catch(i){throw new Error(`Failed to generate kernel's output[${e}] with dims [${t}]. If you are running with pre-allocated output, please make sure the output type/dims are correct. Error: ${i}`)}finally{this.module.stackRestore(r)}}},Dp=async(e,t,r,i)=>{let a=t.jsepInit;if(!a)throw new Error("Failed to initialize JSEP. The WebAssembly module is not built with JSEP support.");if(e==="webgpu"){let n=(hh(),ze(Cp)).WebGpuBackend,s=new n;await s.initialize(r,i),a("webgpu",[s,o=>s.alloc(Number(o)),o=>s.free(o),(o,u,l,d=!1)=>{if(d)Te("verbose",()=>`[WebGPU] jsepCopyGpuToGpu: src=${Number(o)}, dst=${Number(u)}, size=${Number(l)}`),s.memcpy(Number(o),Number(u));else{Te("verbose",()=>`[WebGPU] jsepCopyCpuToGpu: dataOffset=${Number(o)}, gpuDataId=${Number(u)}, size=${Number(l)}`);let p=t.HEAPU8.subarray(Number(o>>>0),Number(o>>>0)+Number(l));s.upload(Number(u),p)}},async(o,u,l)=>{Te("verbose",()=>`[WebGPU] jsepCopyGpuToCpu: gpuDataId=${o}, dataOffset=${u}, size=${l}`),await s.download(Number(o),()=>t.HEAPU8.subarray(Number(u)>>>0,Number(u+l)>>>0))},(o,u,l)=>s.createKernel(o,Number(u),l,t.UTF8ToString(t._JsepGetNodeName(Number(u)))),o=>s.releaseKernel(o),(o,u,l,d)=>{Te("verbose",()=>`[WebGPU] jsepRun: sessionHandle=${l}, kernel=${o}, contextDataOffset=${u}`);let p=new Mp(t,s,Number(u));return s.computeKernel(Number(o),p,d)},()=>s.captureBegin(),()=>s.captureEnd(),()=>s.replay()])}else{let n=new ia(r);a("webnn",[n,()=>n.reserveTensorId(),s=>n.releaseTensorId(s),async(s,o,u,l,d)=>n.ensureTensor(s,o,u,l,d),(s,o)=>{n.uploadTensor(s,o)},async(s,o)=>n.downloadTensor(s,o),(s,o)=>n.registerMLContext(s,o),!!r.trace])}}}),Pp,rs,is,fr,Up,as,qa,ns,ss,os,us,ls,ds,Np=C(()=>{Je(),dn(),pn(),pe(),bt(),Dr(),Xi(),Pp=(e,t)=>{he()._OrtInit(e,t)!==0&&le("Can't initialize onnxruntime.")},rs=async e=>{Pp(e.wasm.numThreads,Ur(e.logLevel))},is=async(e,t)=>{var i,a;(a=(i=he()).asyncInit)==null||a.call(i);let r=e.webgpu.adapter;if(t==="webgpu"){if(typeof navigator>"u"||!navigator.gpu)throw new Error("WebGPU is not supported in current environment");if(r){if(typeof r.limits!="object"||typeof r.features!="object"||typeof r.requestDevice!="function")throw new Error("Invalid GPU adapter set in `env.webgpu.adapter`. It must be a GPUAdapter object.")}else{let n=e.webgpu.powerPreference;if(n!==void 0&&n!=="low-power"&&n!=="high-performance")throw new Error(`Invalid powerPreference setting: "${n}"`);let s=e.webgpu.forceFallbackAdapter;if(s!==void 0&&typeof s!="boolean")throw new Error(`Invalid forceFallbackAdapter setting: "${s}"`);if(r=await navigator.gpu.requestAdapter({powerPreference:n,forceFallbackAdapter:s}),!r)throw new Error('Failed to get GPU adapter. You may need to enable flag "--enable-unsafe-webgpu" if you are using Chrome.')}}if(t==="webnn"&&(typeof navigator>"u"||!navigator.ml))throw new Error("WebNN is not supported in current environment");{let n=(fh(),ze(Bp)).init;t==="webgpu"&&await n("webgpu",he(),e,r),t==="webnn"&&await n("webnn",he(),e)}},fr=new Map,Up=e=>{let t=he(),r=t.stackSave();try{let i=t.PTR_SIZE,a=t.stackAlloc(2*i);t._OrtGetInputOutputCount(e,a,a+i)!==0&&le("Can't get session input/output count.");let n=i===4?"i32":"i64";return[Number(t.getValue(a,n)),Number(t.getValue(a+i,n))]}finally{t.stackRestore(r)}},as=(e,t)=>{let r=he(),i=r.stackSave(),a=0;try{let n=r.PTR_SIZE,s=r.stackAlloc(2*n);r._OrtGetInputOutputMetadata(e,t,s,s+n)!==0&&le("Can't get session input/output metadata.");let o=Number(r.getValue(s,"*"));a=Number(r.getValue(s+n,"*"));let u=r.HEAP32[a/4];if(u===0)return[o,0];let l=r.HEAPU32[a/4+1],d=[];for(let p=0;p<l;p++){let h=Number(r.getValue(a+8+p*n,"*"));d.push(h!==0?r.UTF8ToString(h):Number(r.getValue(a+8+(p+l)*n,"*")))}return[o,u,d]}finally{r.stackRestore(i),a!==0&&r._OrtFree(a)}},qa=e=>{let t=he(),r=t._malloc(e.byteLength);if(r===0)throw new Error(`Can't create a session. failed to allocate a buffer of size ${e.byteLength}.`);return t.HEAPU8.set(e,r),[r,e.byteLength]},ns=async(e,t)=>{var p,h,f,m;let r,i,a=he();Array.isArray(e)?[r,i]=e:e.buffer===a.HEAPU8.buffer?[r,i]=[e.byteOffset,e.byteLength]:[r,i]=qa(e);let n=0,s=0,o=0,u=[],l=[],d=[];try{if([s,u]=await Qi(t),(t==null?void 0:t.externalData)&&a.mountExternalData){let N=[];for(let W of t.externalData){let Q=typeof W=="string"?W:W.path;N.push(Vr(typeof W=="string"?W:W.data).then(de=>{a.mountExternalData(Q,de)}))}await Promise.all(N)}for(let N of(t==null?void 0:t.executionProviders)??[])if((typeof N=="string"?N:N.name)==="webnn"){if(a.shouldTransferToMLTensor=!1,typeof N!="string"){let W=N,Q=W==null?void 0:W.context,de=W==null?void 0:W.gpuDevice,te=W==null?void 0:W.deviceType,ue=W==null?void 0:W.powerPreference;Q?a.currentContext=Q:de?a.currentContext=await a.webnnCreateMLContext(de):a.currentContext=await a.webnnCreateMLContext({deviceType:te,powerPreference:ue})}else a.currentContext=await a.webnnCreateMLContext();break}n=await a._OrtCreateSession(r,i,s),(p=a.webgpuOnCreateSession)==null||p.call(a,n),n===0&&le("Can't create a session."),(h=a.jsepOnCreateSession)==null||h.call(a),a.currentContext&&(a.webnnRegisterMLContext(n,a.currentContext),a.currentContext=void 0,a.shouldTransferToMLTensor=!0);let[y,v]=Up(n),_=!!(t!=null&&t.enableGraphCapture),w=[],S=[],x=[],z=[],D=[];for(let N=0;N<y;N++){let[W,Q,de]=as(n,N);W===0&&le("Can't get an input name."),l.push(W);let te=a.UTF8ToString(W);w.push(te),x.push(Q===0?{name:te,isTensor:!1}:{name:te,isTensor:!0,type:$t(Q),shape:de})}for(let N=0;N<v;N++){let[W,Q,de]=as(n,N+y);W===0&&le("Can't get an output name."),d.push(W);let te=a.UTF8ToString(W);S.push(te),z.push(Q===0?{name:te,isTensor:!1}:{name:te,isTensor:!0,type:$t(Q),shape:de});{if(_&&(t==null?void 0:t.preferredOutputLocation)===void 0){D.push("gpu-buffer");continue}let ue=typeof(t==null?void 0:t.preferredOutputLocation)=="string"?t.preferredOutputLocation:((f=t==null?void 0:t.preferredOutputLocation)==null?void 0:f[te])??"cpu",Ae=a.webnnIsGraphOutput;if(ue==="cpu"&&Ae&&Ae(n,te)){D.push("ml-tensor-cpu-output");continue}if(ue!=="cpu"&&ue!=="cpu-pinned"&&ue!=="gpu-buffer"&&ue!=="ml-tensor")throw new Error(`Not supported preferred output location: ${ue}.`);if(_&&ue!=="gpu-buffer")throw new Error(`Not supported preferred output location: ${ue}. Only 'gpu-buffer' location is supported when enableGraphCapture is true.`);D.push(ue)}}let M=null;return D.some(N=>N==="gpu-buffer"||N==="ml-tensor"||N==="ml-tensor-cpu-output")&&(o=a._OrtCreateBinding(n),o===0&&le("Can't create IO binding."),M={handle:o,outputPreferredLocations:D,outputPreferredLocationsEncoded:D.map(N=>N==="ml-tensor-cpu-output"?"ml-tensor":N).map(N=>ni(N))}),fr.set(n,[n,l,d,M,_,!1]),[n,w,S,x,z]}catch(y){throw l.forEach(v=>a._OrtFree(v)),d.forEach(v=>a._OrtFree(v)),o!==0&&a._OrtReleaseBinding(o)!==0&&le("Can't release IO binding."),n!==0&&a._OrtReleaseSession(n)!==0&&le("Can't release session."),y}finally{a._free(r),s!==0&&a._OrtReleaseSessionOptions(s)!==0&&le("Can't release session options."),u.forEach(y=>a._free(y)),(m=a.unmountExternalData)==null||m.call(a)}},ss=e=>{var u,l,d;let t=he(),r=fr.get(e);if(!r)throw new Error(`cannot release session. invalid session id: ${e}`);let[i,a,n,s,o]=r;s&&(o&&t._OrtClearBoundOutputs(s.handle)!==0&&le("Can't clear bound outputs."),t._OrtReleaseBinding(s.handle)!==0&&le("Can't release IO binding.")),(u=t.jsepOnReleaseSession)==null||u.call(t,e),(l=t.webnnOnReleaseSession)==null||l.call(t,e),(d=t.webgpuOnReleaseSession)==null||d.call(t,e),a.forEach(p=>t._OrtFree(p)),n.forEach(p=>t._OrtFree(p)),t._OrtReleaseSession(i)!==0&&le("Can't release session."),fr.delete(e)},os=async(e,t,r,i,a,n,s=!1)=>{if(!e){t.push(0);return}let o=he(),u=o.PTR_SIZE,l=e[0],d=e[1],p=e[3],h=p,f,m;if(l==="string"&&(p==="gpu-buffer"||p==="ml-tensor"))throw new Error("String tensor is not supported on GPU.");if(s&&p!=="gpu-buffer")throw new Error(`External buffer must be provided for input/output index ${n} when enableGraphCapture is true.`);if(p==="gpu-buffer"){let _=e[2].gpuBuffer;m=xt(vt(l),d);{let w=o.jsepRegisterBuffer;if(!w)throw new Error('Tensor location "gpu-buffer" is not supported without using WebGPU.');f=w(i,n,_,m)}}else if(p==="ml-tensor"){let _=e[2].mlTensor;m=xt(vt(l),d);let w=o.webnnRegisterMLTensor;if(!w)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');f=w(i,_,vt(l),d)}else{let _=e[2];if(Array.isArray(_)){m=u*_.length,f=o._malloc(m),r.push(f);for(let w=0;w<_.length;w++){if(typeof _[w]!="string")throw new TypeError(`tensor data at index ${w} is not a string`);o.setValue(f+w*u,Ge(_[w],r),"*")}}else{let w=o.webnnIsGraphInput,S=o.webnnIsGraphOutput;if(l!=="string"&&w&&S){let x=o.UTF8ToString(a);if(w(i,x)||S(i,x)){let z=vt(l);m=xt(z,d),h="ml-tensor";let D=o.webnnCreateTemporaryTensor,M=o.webnnUploadTensor;if(!D||!M)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');let N=await D(i,z,d);M(N,new Uint8Array(_.buffer,_.byteOffset,_.byteLength)),f=N}else m=_.byteLength,f=o._malloc(m),r.push(f),o.HEAPU8.set(new Uint8Array(_.buffer,_.byteOffset,m),f)}else m=_.byteLength,f=o._malloc(m),r.push(f),o.HEAPU8.set(new Uint8Array(_.buffer,_.byteOffset,m),f)}}let y=o.stackSave(),v=o.stackAlloc(4*d.length);try{d.forEach((w,S)=>o.setValue(v+S*u,w,u===4?"i32":"i64"));let _=o._OrtCreateTensor(vt(l),f,m,v,d.length,ni(h));_===0&&le(`Can't create tensor for input/output. session=${i}, index=${n}.`),t.push(_)}finally{o.stackRestore(y)}},us=async(e,t,r,i,a,n)=>{var de,te,ue,Ae;let s=he(),o=s.PTR_SIZE,u=fr.get(e);if(!u)throw new Error(`cannot run inference. invalid session id: ${e}`);let l=u[0],d=u[1],p=u[2],h=u[3],f=u[4],m=u[5],y=t.length,v=i.length,_=0,w=[],S=[],x=[],z=[],D=s.stackSave(),M=s.stackAlloc(y*o),N=s.stackAlloc(y*o),W=s.stackAlloc(v*o),Q=s.stackAlloc(v*o);try{[_,w]=Gi(n),dt("wasm prepareInputOutputTensor");for(let ae=0;ae<y;ae++)await os(r[ae],S,z,e,d[t[ae]],t[ae],f);for(let ae=0;ae<v;ae++)await os(a[ae],x,z,e,p[i[ae]],y+i[ae],f);pt("wasm prepareInputOutputTensor");for(let ae=0;ae<y;ae++)s.setValue(M+ae*o,S[ae],"*"),s.setValue(N+ae*o,d[t[ae]],"*");for(let ae=0;ae<v;ae++)s.setValue(W+ae*o,x[ae],"*"),s.setValue(Q+ae*o,p[i[ae]],"*");if(h&&!m){let{handle:ae,outputPreferredLocations:fe,outputPreferredLocationsEncoded:ot}=h;if(d.length!==y)throw new Error(`input count from feeds (${y}) is expected to be always equal to model's input count (${d.length}).`);dt("wasm bindInputsOutputs");for(let q=0;q<y;q++){let Y=t[q];await s._OrtBindInput(ae,d[Y],S[q])!==0&&le(`Can't bind input[${q}] for session=${e}.`)}for(let q=0;q<v;q++){let Y=i[q];(de=a[q])!=null&&de[3]?s._OrtBindOutput(ae,p[Y],x[q],0)!==0&&le(`Can't bind pre-allocated output[${q}] for session=${e}.`):s._OrtBindOutput(ae,p[Y],0,ot[Y])!==0&&le(`Can't bind output[${q}] to ${fe[q]} for session=${e}.`)}pt("wasm bindInputsOutputs"),fr.set(e,[l,d,p,h,f,!0])}(te=s.jsepOnRunStart)==null||te.call(s,l),(ue=s.webnnOnRunStart)==null||ue.call(s,l);let be;h?be=await s._OrtRunWithBinding(l,h.handle,v,W,_):be=await s._OrtRun(l,N,M,y,Q,v,W,_),be!==0&&le("failed to call OrtRun().");let se=[],$e=[];dt("wasm ProcessOutputTensor");for(let ae=0;ae<v;ae++){let fe=Number(s.getValue(W+ae*o,"*"));if(fe===x[ae]){se.push(a[ae]);continue}let ot=s.stackSave(),q=s.stackAlloc(4*o),Y=!1,oe,xe=0;try{s._OrtGetTensorData(fe,q,q+o,q+2*o,q+3*o)!==0&&le(`Can't access output tensor data on index ${ae}.`);let kt=o===4?"i32":"i64",xi=Number(s.getValue(q,kt));xe=s.getValue(q+o,"*");let ec=s.getValue(q+o*2,"*"),_h=Number(s.getValue(q+o*3,kt)),gr=[];for(let st=0;st<_h;st++)gr.push(Number(s.getValue(ec+st*o,kt)));s._OrtFree(ec)!==0&&le("Can't free memory for tensor dims.");let yr=gr.reduce((st,Xe)=>st*Xe,1);oe=$t(xi);let _a=h==null?void 0:h.outputPreferredLocations[i[ae]];if(oe==="string"){if(_a==="gpu-buffer"||_a==="ml-tensor")throw new Error("String tensor is not supported on GPU.");let st=[];for(let Xe=0;Xe<yr;Xe++){let sr=s.getValue(xe+Xe*o,"*"),bh=s.getValue(xe+(Xe+1)*o,"*"),vh=Xe===yr-1?void 0:bh-sr;st.push(s.UTF8ToString(sr,vh))}se.push([oe,gr,st,"cpu"])}else if(_a==="gpu-buffer"&&yr>0){let st=s.jsepGetBuffer;if(!st)throw new Error('preferredLocation "gpu-buffer" is not supported without using WebGPU.');let Xe=st(xe),sr=xt(xi,yr);if(sr===void 0||!Nr(oe))throw new Error(`Unsupported data type: ${oe}`);Y=!0,se.push([oe,gr,{gpuBuffer:Xe,download:s.jsepCreateDownloader(Xe,sr,oe),dispose:()=>{s._OrtReleaseTensor(fe)!==0&&le("Can't release tensor.")}},"gpu-buffer"])}else if(_a==="ml-tensor"&&yr>0){let st=s.webnnEnsureTensor,Xe=s.webnnIsGraphInputOutputTypeSupported;if(!st||!Xe)throw new Error('preferredLocation "ml-tensor" is not supported without using WebNN.');if(xt(xi,yr)===void 0||!Lr(oe))throw new Error(`Unsupported data type: ${oe}`);if(!Xe(e,oe,!1))throw new Error(`preferredLocation "ml-tensor" for ${oe} output is not supported by current WebNN Context.`);let sr=await st(e,xe,xi,gr,!1);Y=!0,se.push([oe,gr,{mlTensor:sr,download:s.webnnCreateMLTensorDownloader(xe,oe),dispose:()=>{s.webnnReleaseTensorId(xe),s._OrtReleaseTensor(fe)}},"ml-tensor"])}else if(_a==="ml-tensor-cpu-output"&&yr>0){let st=s.webnnCreateMLTensorDownloader(xe,oe)(),Xe=se.length;Y=!0,$e.push((async()=>{let sr=[Xe,await st];return s.webnnReleaseTensorId(xe),s._OrtReleaseTensor(fe),sr})()),se.push([oe,gr,[],"cpu"])}else{let st=Pr(oe),Xe=new st(yr);new Uint8Array(Xe.buffer,Xe.byteOffset,Xe.byteLength).set(s.HEAPU8.subarray(xe,xe+Xe.byteLength)),se.push([oe,gr,Xe,"cpu"])}}finally{s.stackRestore(ot),oe==="string"&&xe&&s._free(xe),Y||s._OrtReleaseTensor(fe)}}h&&!f&&(s._OrtClearBoundOutputs(h.handle)!==0&&le("Can't clear bound outputs."),fr.set(e,[l,d,p,h,f,!1]));for(let[ae,fe]of await Promise.all($e))se[ae][2]=fe;return pt("wasm ProcessOutputTensor"),se}finally{(Ae=s.webnnOnRunEnd)==null||Ae.call(s,l),s.stackRestore(D),S.forEach(be=>s._OrtReleaseTensor(be)),x.forEach(be=>s._OrtReleaseTensor(be)),z.forEach(be=>s._free(be)),_!==0&&s._OrtReleaseRunOptions(_),w.forEach(be=>s._free(be))}},ls=e=>{let t=he(),r=fr.get(e);if(!r)throw new Error("invalid session id");let i=r[0],a=t._OrtEndProfiling(i);a===0&&le("Can't get an profile file name."),t._OrtFree(a)},ds=e=>{let t=[];for(let r of e){let i=r[2];!Array.isArray(i)&&"buffer"in i&&t.push(i.buffer)}return t}}),mr,Tt,$i,ya,wa,Ga,ps,Ha,ei,ti,Lp,Vp,Wp,Fp,qp,Gp,Hp,jp,Kp=C(()=>{Je(),Np(),bt(),Or(),mr=()=>!!re.wasm.proxy&&typeof document<"u",$i=!1,ya=!1,wa=!1,Ha=new Map,ei=(e,t)=>{let r=Ha.get(e);r?r.push(t):Ha.set(e,[t])},ti=()=>{if($i||!ya||wa||!Tt)throw new Error("worker not ready")},Lp=e=>{switch(e.data.type){case"init-wasm":$i=!1,e.data.err?(wa=!0,ps[1](e.data.err)):(ya=!0,ps[0]()),Ga&&(URL.revokeObjectURL(Ga),Ga=void 0);break;case"init-ep":case"copy-from":case"create":case"release":case"run":case"end-profiling":{let t=Ha.get(e.data.type);e.data.err?t.shift()[1](e.data.err):t.shift()[0](e.data.out);break}}},Vp=async()=>{if(!ya){if($i)throw new Error("multiple calls to 'initWasm()' detected.");if(wa)throw new Error("previous call to 'initWasm()' failed.");if($i=!0,mr())return new Promise((e,t)=>{Tt==null||Tt.terminate(),Li().then(([r,i])=>{try{Tt=i,Tt.onerror=n=>t(n),Tt.onmessage=Lp,ps=[e,t];let a={type:"init-wasm",in:re};if(!a.in.wasm.wasmPaths&&r){let n=kr();n&&(a.in.wasm.wasmPaths=n)}Tt.postMessage(a),Ga=r}catch(a){t(a)}},t)});try{await Mr(re.wasm),await rs(re),ya=!0}catch(e){throw wa=!0,e}finally{$i=!1}}},Wp=async e=>{if(mr())return ti(),new Promise((t,r)=>{ei("init-ep",[t,r]);let i={type:"init-ep",in:{epName:e,env:re}};Tt.postMessage(i)});await is(re,e)},Fp=async e=>mr()?(ti(),new Promise((t,r)=>{ei("copy-from",[t,r]);let i={type:"copy-from",in:{buffer:e}};Tt.postMessage(i,[e.buffer])})):qa(e),qp=async(e,t)=>{if(mr()){if(t!=null&&t.preferredOutputLocation)throw new Error('session option "preferredOutputLocation" is not supported for proxy.');return ti(),new Promise((r,i)=>{ei("create",[r,i]);let a={type:"create",in:{model:e,options:{...t}}},n=[];e instanceof Uint8Array&&n.push(e.buffer),Tt.postMessage(a,n)})}else return ns(e,t)},Gp=async e=>{if(mr())return ti(),new Promise((t,r)=>{ei("release",[t,r]);let i={type:"release",in:e};Tt.postMessage(i)});ss(e)},Hp=async(e,t,r,i,a,n)=>{if(mr()){if(r.some(s=>s[3]!=="cpu"))throw new Error("input tensor on GPU is not supported for proxy.");if(a.some(s=>s))throw new Error("pre-allocated output tensor is not supported for proxy.");return ti(),new Promise((s,o)=>{ei("run",[s,o]);let u=r,l={type:"run",in:{sessionId:e,inputIndices:t,inputs:u,outputIndices:i,options:n}};Tt.postMessage(l,ds(u))})}else return us(e,t,r,i,a,n)},jp=async e=>{if(mr())return ti(),new Promise((t,r)=>{ei("end-profiling",[t,r]);let i={type:"end-profiling",in:e};Tt.postMessage(i)});ls(e)}}),cs,Zp,Qp,mh=C(()=>{Je(),Kp(),pe(),Tr(),Xi(),cs=(e,t)=>{switch(e.location){case"cpu":return[e.type,e.dims,e.data,"cpu"];case"gpu-buffer":return[e.type,e.dims,{gpuBuffer:e.gpuBuffer},"gpu-buffer"];case"ml-tensor":return[e.type,e.dims,{mlTensor:e.mlTensor},"ml-tensor"];default:throw new Error(`invalid data location: ${e.location} for ${t()}`)}},Zp=e=>{switch(e[3]){case"cpu":return new qe(e[0],e[2],e[1]);case"gpu-buffer":{let t=e[0];if(!Nr(t))throw new Error(`not supported data type: ${t} for deserializing GPU tensor`);let{gpuBuffer:r,download:i,dispose:a}=e[2];return qe.fromGpuBuffer(r,{dataType:t,dims:e[1],download:i,dispose:a})}case"ml-tensor":{let t=e[0];if(!Lr(t))throw new Error(`not supported data type: ${t} for deserializing MLTensor tensor`);let{mlTensor:r,download:i,dispose:a}=e[2];return qe.fromMLTensor(r,{dataType:t,dims:e[1],download:i,dispose:a})}default:throw new Error(`invalid data location: ${e[3]}`)}},Qp=class{async fetchModelAndCopyToWasmMemory(e){return Fp(await Vr(e))}async loadModel(e,t){et();let r;typeof e=="string"?r=await this.fetchModelAndCopyToWasmMemory(e):r=e,[this.sessionId,this.inputNames,this.outputNames,this.inputMetadata,this.outputMetadata]=await qp(r,t),Ye()}async dispose(){return Gp(this.sessionId)}async run(e,t,r){et();let i=[],a=[];Object.entries(e).forEach(p=>{let h=p[0],f=p[1],m=this.inputNames.indexOf(h);if(m===-1)throw new Error(`invalid input '${h}'`);i.push(f),a.push(m)});let n=[],s=[];Object.entries(t).forEach(p=>{let h=p[0],f=p[1],m=this.outputNames.indexOf(h);if(m===-1)throw new Error(`invalid output '${h}'`);n.push(f),s.push(m)});let o=i.map((p,h)=>cs(p,()=>`input "${this.inputNames[a[h]]}"`)),u=n.map((p,h)=>p?cs(p,()=>`output "${this.outputNames[s[h]]}"`):null),l=await Hp(this.sessionId,a,o,s,u,r),d={};for(let p=0;p<l.length;p++)d[this.outputNames[s[p]]]=n[p]??Zp(l[p]);return Ye(),d}startProfiling(){}endProfiling(){jp(this.sessionId)}}}),Xp={};ge(Xp,{OnnxruntimeWebAssemblyBackend:()=>fs,initializeFlags:()=>hs,wasmBackend:()=>Yp});var hs,fs,Yp,gh=C(()=>{Je(),Kp(),mh(),hs=()=>{(typeof re.wasm.initTimeout!="number"||re.wasm.initTimeout<0)&&(re.wasm.initTimeout=0);let e=re.wasm.simd;if(typeof e!="boolean"&&e!==void 0&&e!=="fixed"&&e!=="relaxed"&&(console.warn(`Property "env.wasm.simd" is set to unknown value "${e}". Reset it to \`false\` and ignore SIMD feature checking.`),re.wasm.simd=!1),typeof re.wasm.proxy!="boolean"&&(re.wasm.proxy=!1),typeof re.wasm.trace!="boolean"&&(re.wasm.trace=!1),typeof re.wasm.numThreads!="number"||!Number.isInteger(re.wasm.numThreads)||re.wasm.numThreads<=0)if(typeof self<"u"&&!self.crossOriginIsolated)re.wasm.numThreads=1;else{let t=typeof navigator>"u"?J("node:os").cpus().length:navigator.hardwareConcurrency;re.wasm.numThreads=Math.min(4,Math.ceil((t||1)/2))}},fs=class{async init(e){hs(),await Vp(),await Wp(e)}async createInferenceSessionHandler(e,t){let r=new Qp;return await r.loadModel(e,t),r}},Yp=new fs}),Jp={};ge(Jp,{InferenceSession:()=>Sr,TRACE:()=>jt,TRACE_EVENT_BEGIN:()=>dt,TRACE_EVENT_END:()=>pt,TRACE_FUNC_BEGIN:()=>et,TRACE_FUNC_END:()=>Ye,Tensor:()=>qe,default:()=>wh,env:()=>re,registerBackend:()=>we}),Je(),Je(),Je();var yh="1.23.2",wh=Oi;{let e=(gh(),ze(Xp)).wasmBackend;we("webgpu",e,5),we("webnn",e,5),we("cpu",e,10),we("wasm",e,10)}return Object.defineProperty(re.versions,"web",{value:yh,enumerable:!0}),ze(Jp)})();/**
 * @license
 * Copyright 2021 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 *//**
 * @license
 * Copyright 2020 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 *//**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */k.exports=L})(cc);var Ih=cc.exports,ws={},mc={};Object.defineProperty(mc,"__esModule",{value:!0});var Ya={},gc;Object.defineProperty(Ya,"__esModule",{value:!0});Ya.SileroLegacy=void 0;const nc=wr;class _s{constructor(A,L,F,K,X){this.ortInstance=A,this._session=L,this._h=F,this._c=K,this._sr=X,this.reset_state=()=>{const H=Array(128).fill(0);this._h=new this.ortInstance.Tensor("float32",H,[2,1,64]),this._c=new this.ortInstance.Tensor("float32",H,[2,1,64])},this.process=async H=>{var Se;const C={input:new this.ortInstance.Tensor("float32",H,[1,H.length]),h:this._h,c:this._c,sr:this._sr},ge=await this._session.run(C);this._h=ge.hn,this._c=ge.cn;const[je]=(Se=ge.output)==null?void 0:Se.data;return{notSpeech:1-je,isSpeech:je}},this.release=async()=>{await this._session.release(),this._h.dispose(),this._c.dispose(),this._sr.dispose()}}}Ya.SileroLegacy=_s;gc=_s;_s.new=async(k,A)=>{nc.log.debug("initializing vad");const L=await A(),F=await k.InferenceSession.create(L),K=new k.Tensor("int64",[16000n]),X=Array(2*64).fill(0),H=new k.Tensor("float32",X,[2,1,64]),J=new k.Tensor("float32",X,[2,1,64]);return nc.log.debug("vad is initialized"),new gc(k,F,H,J,K)};var Ja={},yc;Object.defineProperty(Ja,"__esModule",{value:!0});Ja.SileroV5=void 0;const sc=wr;function wc(k){const A=Array(256).fill(0);return new k.Tensor("float32",A,[2,1,128])}class bs{constructor(A,L,F,K){this._session=A,this._state=L,this._sr=F,this.ortInstance=K,this.reset_state=()=>{this._state=wc(this.ortInstance)},this.process=async X=>{var ze;const J={input:new this.ortInstance.Tensor("float32",X,[1,X.length]),state:this._state,sr:this._sr},C=await this._session.run(J);if(!C.stateN)throw new Error("No state from model");if(this._state=C.stateN,!((ze=C.output)!=null&&ze.data))throw new Error("No output from model");const ge=C.output.data[0];if(typeof ge!="number")throw new Error("Weird output data");return{notSpeech:1-ge,isSpeech:ge}},this.release=async()=>{await this._session.release(),this._state.dispose(),this._sr.dispose()}}}Ja.SileroV5=bs;yc=bs;bs.new=async(k,A)=>{sc.log.debug("Loading VAD...");const L=await A(),F=await k.InferenceSession.create(L),K=new k.Tensor("int64",[16000n]),X=wc(k);return sc.log.debug("...finished loading VAD"),new yc(F,X,K,k)};(function(k){var A=ft&&ft.__createBinding||(Object.create?function(X,H,J,C){C===void 0&&(C=J);var ge=Object.getOwnPropertyDescriptor(H,J);(!ge||("get"in ge?!H.__esModule:ge.writable||ge.configurable))&&(ge={enumerable:!0,get:function(){return H[J]}}),Object.defineProperty(X,C,ge)}:function(X,H,J,C){C===void 0&&(C=J),X[C]=H[J]}),L=ft&&ft.__exportStar||function(X,H){for(var J in X)J!=="default"&&!Object.prototype.hasOwnProperty.call(H,J)&&A(H,X,J)};Object.defineProperty(k,"__esModule",{value:!0}),k.SileroV5=k.SileroLegacy=void 0,L(mc,k);var F=Ya;Object.defineProperty(k,"SileroLegacy",{enumerable:!0,get:function(){return F.SileroLegacy}});var K=Ja;Object.defineProperty(k,"SileroV5",{enumerable:!0,get:function(){return K.SileroV5}})})(ws);var ka={};Object.defineProperty(ka,"__esModule",{value:!0});ka.Resampler=void 0;const kh=wr;class Ch{constructor(A){this.options=A,this.process=L=>{const F=[];for(const K of L)for(this.inputBuffer.push(K);this.hasEnoughDataForFrame();){const X=this.generateOutputFrame();F.push(X)}return F},A.nativeSampleRate<16e3&&kh.log.error("nativeSampleRate is too low. Should have 16000 = targetSampleRate <= nativeSampleRate"),this.inputBuffer=[]}async*stream(A){for(const L of A)for(this.inputBuffer.push(L);this.hasEnoughDataForFrame();)yield this.generateOutputFrame()}hasEnoughDataForFrame(){return this.inputBuffer.length*this.options.targetSampleRate/this.options.nativeSampleRate>=this.options.targetFrameSize}generateOutputFrame(){const A=new Float32Array(this.options.targetFrameSize);let L=0,F=0;for(;L<this.options.targetFrameSize;){let K=0,X=0;for(;F<Math.min(this.inputBuffer.length,(L+1)*this.options.nativeSampleRate/this.options.targetSampleRate);){const H=this.inputBuffer[F];H!==void 0&&(K+=H,X++),F++}A[L]=K/X,L++}return this.inputBuffer=this.inputBuffer.slice(F),A}}ka.Resampler=Ch;(function(k){var A=ft&&ft.__createBinding||(Object.create?function(Se,ve,we,Ne){Ne===void 0&&(Ne=we);var Ke=Object.getOwnPropertyDescriptor(ve,we);(!Ke||("get"in Ke?!ve.__esModule:Ke.writable||Ke.configurable))&&(Ke={enumerable:!0,get:function(){return ve[we]}}),Object.defineProperty(Se,Ne,Ke)}:function(Se,ve,we,Ne){Ne===void 0&&(Ne=we),Se[Ne]=ve[we]}),L=ft&&ft.__setModuleDefault||(Object.create?function(Se,ve){Object.defineProperty(Se,"default",{enumerable:!0,value:ve})}:function(Se,ve){Se.default=ve}),F=ft&&ft.__importStar||function(Se){if(Se&&Se.__esModule)return Se;var ve={};if(Se!=null)for(var we in Se)we!=="default"&&Object.prototype.hasOwnProperty.call(Se,we)&&A(ve,Se,we);return L(ve,Se),ve};Object.defineProperty(k,"__esModule",{value:!0}),k.NonRealTimeVAD=k.defaultNonRealTimeVADOptions=void 0;const K=F(Ih),X=Ia,H=Si,J=er,C=ai,ge=ws,je=ka;k.defaultNonRealTimeVADOptions={...J.defaultFrameProcessorOptions,modelURL:X.baseAssetPath+"silero_vad_legacy.onnx",modelFetcher:H.defaultModelFetcher};class ze{static async new(ve={}){const we={...k.defaultNonRealTimeVADOptions,...ve};(0,J.validateOptions)(we),we.ortConfig!==void 0&&we.ortConfig(K);const Ne=()=>we.modelFetcher(we.modelURL),Ke=await ge.SileroLegacy.new(K,Ne),wt=new J.FrameProcessor(Ke.process,Ke.reset_state,{positiveSpeechThreshold:we.positiveSpeechThreshold,negativeSpeechThreshold:we.negativeSpeechThreshold,redemptionMs:we.redemptionMs,preSpeechPadMs:we.preSpeechPadMs,minSpeechMs:we.minSpeechMs,submitUserSpeechOnPause:we.submitUserSpeechOnPause},1536/16);return wt.resume(),new this(Ne,K,we,wt)}constructor(ve,we,Ne,Ke){this.modelFetcher=ve,this.ort=we,this.options=Ne,this.frameProcessor=Ke,this.frameSamples=1536}async*run(ve,we){const Ne={nativeSampleRate:we,targetSampleRate:16e3,targetFrameSize:this.frameSamples},Ke=new je.Resampler(Ne);let wt=0,Rt=0,Ie=0;for await(const me of Ke.stream(ve)){const ce=[];await this.frameProcessor.process(me,Ve=>{ce.push(Ve)});for(const Ve of ce)switch(Ve.msg){case C.Message.SpeechStart:wt=Ie*this.frameSamples/16;break;case C.Message.SpeechEnd:Rt=(Ie+1)*this.frameSamples/16,yield{audio:Ve.audio,start:wt,end:Rt};break}Ie++}const ke=[];this.frameProcessor.endSegment(me=>{ke.push(me)});for(const me of ke)switch(me.msg){case C.Message.SpeechEnd:yield{audio:me.audio,start:wt,end:Ie*this.frameSamples/16}}}}k.NonRealTimeVAD=ze})(pc);var Jt={};Object.defineProperty(Jt,"__esModule",{value:!0});Jt.audioFileToArray=Jt.encodeWAV=Jt.arrayBufferToBase64=Jt.minFramesForTargetMS=void 0;function Ah(k,A,L=16e3){return Math.ceil(k*L/1e3/A)}Jt.minFramesForTargetMS=Ah;function zh(k){const A=new Uint8Array(k),L=A.byteLength,F=new Array(L);for(let K=0;K<L;K++){const X=A[K];if(X===void 0)break;F[K]=String.fromCharCode(X)}return btoa(F.join(""))}Jt.arrayBufferToBase64=zh;function Oh(k,A=3,L=16e3,F=1,K=32){const X=K/8,H=F*X,J=new ArrayBuffer(44+k.length*X),C=new DataView(J);return ja(C,0,"RIFF"),C.setUint32(4,36+k.length*X,!0),ja(C,8,"WAVE"),ja(C,12,"fmt "),C.setUint32(16,16,!0),C.setUint16(20,A,!0),C.setUint16(22,F,!0),C.setUint32(24,L,!0),C.setUint32(28,L*H,!0),C.setUint16(32,H,!0),C.setUint16(34,K,!0),ja(C,36,"data"),C.setUint32(40,k.length*X,!0),A===1?Bh(C,44,k):Rh(C,44,k),J}Jt.encodeWAV=Oh;function Rh(k,A,L){for(let F=0;F<L.length;F++,A+=4)k.setFloat32(A,L[F],!0)}function Bh(k,A,L){for(let F=0;F<L.length;F++,A+=2){const K=Math.max(-1,Math.min(1,L[F]));k.setInt16(A,K<0?K*32768:K*32767,!0)}}function ja(k,A,L){for(let F=0;F<L.length;F++)k.setUint8(A+F,L.charCodeAt(F))}async function Mh(k){const A=new OfflineAudioContext(1,1,44100),L=new FileReader;let F=null;if(await new Promise(H=>{L.addEventListener("loadend",()=>{const J=L.result;A.decodeAudioData(J,C=>{F=C,A.startRendering().then(()=>{console.log("Rendering completed successfully"),H()}).catch(ge=>{console.error("Rendering failed: ",ge)})},C=>{console.log("Error with decoding audio data: ",C)})}),L.readAsArrayBuffer(k)}),F===null)throw Error("some shit");const K=F,X=new Float32Array(K.length);for(let H=0;H<K.length;H++)for(let J=0;J<K.numberOfChannels;J++){const C=K.getChannelData(J)[H],ge=X[H];if(C===void 0||ge===void 0)throw new Error("sample or out[i] is undefined");X[H]=ge+C}return{audio:X,sampleRate:K.sampleRate}}Jt.audioFileToArray=Mh;var _c={},bc={exports:{}};/*!
 * ONNX Runtime Web v1.23.2
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */(function(k,A){var L=(()=>{var F=Object.defineProperty,K=Object.getOwnPropertyDescriptor,X=Object.getOwnPropertyNames,H=Object.prototype.hasOwnProperty,J=(c=>typeof zt<"u"?zt:typeof Proxy<"u"?new Proxy(c,{get:(g,b)=>(typeof zt<"u"?zt:g)[b]}):c)(function(c){if(typeof zt<"u")return zt.apply(this,arguments);throw Error('Dynamic require of "'+c+'" is not supported')}),C=(c,g)=>()=>(c&&(g=c(c=0)),g),ge=(c,g)=>{for(var b in g)F(c,b,{get:g[b],enumerable:!0})},je=(c,g,b,T)=>{if(g&&typeof g=="object"||typeof g=="function")for(let $ of X(g))!H.call(c,$)&&$!==b&&F(c,$,{get:()=>g[$],enumerable:!(T=K(g,$))||T.enumerable});return c},ze=c=>je(F({},"__esModule",{value:!0}),c),Se,ve,we,Ne,Ke,wt=C(()=>{Se=new Map,ve=[],we=(c,g,b)=>{if(g&&typeof g.init=="function"&&typeof g.createInferenceSessionHandler=="function"){let T=Se.get(c);if(T===void 0)Se.set(c,{backend:g,priority:b});else{if(T.priority>b)return;if(T.priority===b&&T.backend!==g)throw new Error(`cannot register backend "${c}" using priority ${b}`)}if(b>=0){let $=ve.indexOf(c);$!==-1&&ve.splice($,1);for(let R=0;R<ve.length;R++)if(Se.get(ve[R]).priority<=b){ve.splice(R,0,c);return}ve.push(c)}return}throw new TypeError("not a valid backend")},Ne=async c=>{let g=Se.get(c);if(!g)return"backend not found.";if(g.initialized)return g.backend;if(g.aborted)return g.error;{let b=!!g.initPromise;try{return b||(g.initPromise=g.backend.init(c)),await g.initPromise,g.initialized=!0,g.backend}catch(T){return b||(g.error=`${T}`,g.aborted=!0),g.error}finally{delete g.initPromise}}},Ke=async c=>{let g=c.executionProviders||[],b=g.map(B=>typeof B=="string"?B:B.name),T=b.length===0?ve:b,$,R=[],I=new Set;for(let B of T){let V=await Ne(B);typeof V=="string"?R.push({name:B,err:V}):($||($=V),$===V&&I.add(B))}if(!$)throw new Error(`no available backend found. ERR: ${R.map(B=>`[${B.name}] ${B.err}`).join(", ")}`);for(let{name:B,err:V}of R)b.includes(B)&&console.warn(`removing requested execution provider "${B}" from session options because it is not available: ${V}`);let E=g.filter(B=>I.has(typeof B=="string"?B:B.name));return[$,new Proxy(c,{get:(B,V)=>V==="executionProviders"?E:Reflect.get(B,V)})]}}),Rt=C(()=>{wt()}),Ie,ke=C(()=>{Ie="1.23.2"}),me,ce,Ve=C(()=>{ke(),me="warning",ce={wasm:{},webgl:{},webgpu:{},versions:{common:Ie},set logLevel(c){if(c!==void 0){if(typeof c!="string"||["verbose","info","warning","error","fatal"].indexOf(c)===-1)throw new Error(`Unsupported logging level: ${c}`);me=c}},get logLevel(){return me}},Object.defineProperty(ce,"logLevel",{enumerable:!0})}),re,ut=C(()=>{Ve(),re=ce}),He,mt,ur=C(()=>{He=(c,g)=>{let b=typeof document<"u"?document.createElement("canvas"):new OffscreenCanvas(1,1);b.width=c.dims[3],b.height=c.dims[2];let T=b.getContext("2d");if(T!=null){let $,R;(g==null?void 0:g.tensorLayout)!==void 0&&g.tensorLayout==="NHWC"?($=c.dims[2],R=c.dims[3]):($=c.dims[3],R=c.dims[2]);let I=(g==null?void 0:g.format)!==void 0?g.format:"RGB",E=g==null?void 0:g.norm,B,V;E===void 0||E.mean===void 0?B=[255,255,255,255]:typeof E.mean=="number"?B=[E.mean,E.mean,E.mean,E.mean]:(B=[E.mean[0],E.mean[1],E.mean[2],0],E.mean[3]!==void 0&&(B[3]=E.mean[3])),E===void 0||E.bias===void 0?V=[0,0,0,0]:typeof E.bias=="number"?V=[E.bias,E.bias,E.bias,E.bias]:(V=[E.bias[0],E.bias[1],E.bias[2],0],E.bias[3]!==void 0&&(V[3]=E.bias[3]));let G=R*$,j=0,P=G,ee=G*2,O=-1;I==="RGBA"?(j=0,P=G,ee=G*2,O=G*3):I==="RGB"?(j=0,P=G,ee=G*2):I==="RBG"&&(j=0,ee=G,P=G*2);for(let Z=0;Z<R;Z++)for(let Le=0;Le<$;Le++){let _e=(c.data[j++]-V[0])*B[0],ye=(c.data[P++]-V[1])*B[1],Me=(c.data[ee++]-V[2])*B[2],ie=O===-1?255:(c.data[O++]-V[3])*B[3];T.fillStyle="rgba("+_e+","+ye+","+Me+","+ie+")",T.fillRect(Le,Z,1,1)}if("toDataURL"in b)return b.toDataURL();throw new Error("toDataURL is not supported")}else throw new Error("Can not access image data")},mt=(c,g)=>{let b=typeof document<"u"?document.createElement("canvas").getContext("2d"):new OffscreenCanvas(1,1).getContext("2d"),T;if(b!=null){let $,R,I;(g==null?void 0:g.tensorLayout)!==void 0&&g.tensorLayout==="NHWC"?($=c.dims[2],R=c.dims[1],I=c.dims[3]):($=c.dims[3],R=c.dims[2],I=c.dims[1]);let E=g!==void 0&&g.format!==void 0?g.format:"RGB",B=g==null?void 0:g.norm,V,G;B===void 0||B.mean===void 0?V=[255,255,255,255]:typeof B.mean=="number"?V=[B.mean,B.mean,B.mean,B.mean]:(V=[B.mean[0],B.mean[1],B.mean[2],255],B.mean[3]!==void 0&&(V[3]=B.mean[3])),B===void 0||B.bias===void 0?G=[0,0,0,0]:typeof B.bias=="number"?G=[B.bias,B.bias,B.bias,B.bias]:(G=[B.bias[0],B.bias[1],B.bias[2],0],B.bias[3]!==void 0&&(G[3]=B.bias[3]));let j=R*$;if(g!==void 0&&(g.format!==void 0&&I===4&&g.format!=="RGBA"||I===3&&g.format!=="RGB"&&g.format!=="BGR"))throw new Error("Tensor format doesn't match input tensor dims");let P=4,ee=0,O=1,Z=2,Le=3,_e=0,ye=j,Me=j*2,ie=-1;E==="RGBA"?(_e=0,ye=j,Me=j*2,ie=j*3):E==="RGB"?(_e=0,ye=j,Me=j*2):E==="RBG"&&(_e=0,Me=j,ye=j*2),T=b.createImageData($,R);for(let Ue=0;Ue<R*$;ee+=P,O+=P,Z+=P,Le+=P,Ue++)T.data[ee]=(c.data[_e++]-G[0])*V[0],T.data[O]=(c.data[ye++]-G[1])*V[1],T.data[Z]=(c.data[Me++]-G[2])*V[2],T.data[Le]=ie===-1?255:(c.data[ie++]-G[3])*V[3]}else throw new Error("Can not access image data");return T}}),lt,_t,_r,br,Be,Ct,Ti=C(()=>{$r(),lt=(c,g)=>{if(c===void 0)throw new Error("Image buffer must be defined");if(g.height===void 0||g.width===void 0)throw new Error("Image height and width must be defined");if(g.tensorLayout==="NHWC")throw new Error("NHWC Tensor layout is not supported yet");let{height:b,width:T}=g,$=g.norm??{mean:255,bias:0},R,I;typeof $.mean=="number"?R=[$.mean,$.mean,$.mean,$.mean]:R=[$.mean[0],$.mean[1],$.mean[2],$.mean[3]??255],typeof $.bias=="number"?I=[$.bias,$.bias,$.bias,$.bias]:I=[$.bias[0],$.bias[1],$.bias[2],$.bias[3]??0];let E=g.format!==void 0?g.format:"RGBA",B=g.tensorFormat!==void 0&&g.tensorFormat!==void 0?g.tensorFormat:"RGB",V=b*T,G=B==="RGBA"?new Float32Array(V*4):new Float32Array(V*3),j=4,P=0,ee=1,O=2,Z=3,Le=0,_e=V,ye=V*2,Me=-1;E==="RGB"&&(j=3,P=0,ee=1,O=2,Z=-1),B==="RGBA"?Me=V*3:B==="RBG"?(Le=0,ye=V,_e=V*2):B==="BGR"&&(ye=0,_e=V,Le=V*2);for(let ie=0;ie<V;ie++,P+=j,O+=j,ee+=j,Z+=j)G[Le++]=(c[P]+I[0])/R[0],G[_e++]=(c[ee]+I[1])/R[1],G[ye++]=(c[O]+I[2])/R[2],Me!==-1&&Z!==-1&&(G[Me++]=(c[Z]+I[3])/R[3]);return B==="RGBA"?new De("float32",G,[1,4,b,T]):new De("float32",G,[1,3,b,T])},_t=async(c,g)=>{let b=typeof HTMLImageElement<"u"&&c instanceof HTMLImageElement,T=typeof ImageData<"u"&&c instanceof ImageData,$=typeof ImageBitmap<"u"&&c instanceof ImageBitmap,R=typeof c=="string",I,E=g??{},B=()=>{if(typeof document<"u")return document.createElement("canvas");if(typeof OffscreenCanvas<"u")return new OffscreenCanvas(1,1);throw new Error("Canvas is not supported")},V=G=>typeof HTMLCanvasElement<"u"&&G instanceof HTMLCanvasElement||G instanceof OffscreenCanvas?G.getContext("2d"):null;if(b){let G=B();G.width=c.width,G.height=c.height;let j=V(G);if(j!=null){let P=c.height,ee=c.width;if(g!==void 0&&g.resizedHeight!==void 0&&g.resizedWidth!==void 0&&(P=g.resizedHeight,ee=g.resizedWidth),g!==void 0){if(E=g,g.tensorFormat!==void 0)throw new Error("Image input config format must be RGBA for HTMLImageElement");E.tensorFormat="RGBA",E.height=P,E.width=ee}else E.tensorFormat="RGBA",E.height=P,E.width=ee;j.drawImage(c,0,0),I=j.getImageData(0,0,ee,P).data}else throw new Error("Can not access image data")}else if(T){let G,j;if(g!==void 0&&g.resizedWidth!==void 0&&g.resizedHeight!==void 0?(G=g.resizedHeight,j=g.resizedWidth):(G=c.height,j=c.width),g!==void 0&&(E=g),E.format="RGBA",E.height=G,E.width=j,g!==void 0){let P=B();P.width=j,P.height=G;let ee=V(P);if(ee!=null)ee.putImageData(c,0,0),I=ee.getImageData(0,0,j,G).data;else throw new Error("Can not access image data")}else I=c.data}else if($){if(g===void 0)throw new Error("Please provide image config with format for Imagebitmap");let G=B();G.width=c.width,G.height=c.height;let j=V(G);if(j!=null){let P=c.height,ee=c.width;return j.drawImage(c,0,0,ee,P),I=j.getImageData(0,0,ee,P).data,E.height=P,E.width=ee,lt(I,E)}else throw new Error("Can not access image data")}else{if(R)return new Promise((G,j)=>{let P=B(),ee=V(P);if(!c||!ee)return j();let O=new Image;O.crossOrigin="Anonymous",O.src=c,O.onload=()=>{P.width=O.width,P.height=O.height,ee.drawImage(O,0,0,P.width,P.height);let Z=ee.getImageData(0,0,P.width,P.height);E.height=P.height,E.width=P.width,G(lt(Z.data,E))}});throw new Error("Input data provided is not supported - aborted tensor creation")}if(I!==void 0)return lt(I,E);throw new Error("Input data provided is not supported - aborted tensor creation")},_r=(c,g)=>{let{width:b,height:T,download:$,dispose:R}=g,I=[1,T,b,4];return new De({location:"texture",type:"float32",texture:c,dims:I,download:$,dispose:R})},br=(c,g)=>{let{dataType:b,dims:T,download:$,dispose:R}=g;return new De({location:"gpu-buffer",type:b??"float32",gpuBuffer:c,dims:T,download:$,dispose:R})},Be=(c,g)=>{let{dataType:b,dims:T,download:$,dispose:R}=g;return new De({location:"ml-tensor",type:b??"float32",mlTensor:c,dims:T,download:$,dispose:R})},Ct=(c,g,b)=>new De({location:"cpu-pinned",type:c,data:g,dims:b??[g.length]})}),rt,Bt,vr,Ei,en=C(()=>{rt=new Map([["float32",Float32Array],["uint8",Uint8Array],["int8",Int8Array],["uint16",Uint16Array],["int16",Int16Array],["int32",Int32Array],["bool",Uint8Array],["float64",Float64Array],["uint32",Uint32Array],["int4",Uint8Array],["uint4",Uint8Array]]),Bt=new Map([[Float32Array,"float32"],[Uint8Array,"uint8"],[Int8Array,"int8"],[Uint16Array,"uint16"],[Int16Array,"int16"],[Int32Array,"int32"],[Float64Array,"float64"],[Uint32Array,"uint32"]]),vr=!1,Ei=()=>{if(!vr){vr=!0;let c=typeof BigInt64Array<"u"&&BigInt64Array.from,g=typeof BigUint64Array<"u"&&BigUint64Array.from,b=globalThis.Float16Array,T=typeof b<"u"&&b.from;c&&(rt.set("int64",BigInt64Array),Bt.set(BigInt64Array,"int64")),g&&(rt.set("uint64",BigUint64Array),Bt.set(BigUint64Array,"uint64")),T?(rt.set("float16",b),Bt.set(b,"float16")):rt.set("float16",Uint16Array)}}}),Ii,ki,tn=C(()=>{$r(),Ii=c=>{let g=1;for(let b=0;b<c.length;b++){let T=c[b];if(typeof T!="number"||!Number.isSafeInteger(T))throw new TypeError(`dims[${b}] must be an integer, got: ${T}`);if(T<0)throw new RangeError(`dims[${b}] must be a non-negative integer, got: ${T}`);g*=T}return g},ki=(c,g)=>{switch(c.location){case"cpu":return new De(c.type,c.data,g);case"cpu-pinned":return new De({location:"cpu-pinned",data:c.data,type:c.type,dims:g});case"texture":return new De({location:"texture",texture:c.texture,type:c.type,dims:g});case"gpu-buffer":return new De({location:"gpu-buffer",gpuBuffer:c.gpuBuffer,type:c.type,dims:g});case"ml-tensor":return new De({location:"ml-tensor",mlTensor:c.mlTensor,type:c.type,dims:g});default:throw new Error(`tensorReshape: tensor location ${c.location} is not supported`)}}}),De,$r=C(()=>{ur(),Ti(),en(),tn(),De=class{constructor(c,g,b){Ei();let T,$;if(typeof c=="object"&&"location"in c)switch(this.dataLocation=c.location,T=c.type,$=c.dims,c.location){case"cpu-pinned":{let I=rt.get(T);if(!I)throw new TypeError(`unsupported type "${T}" to create tensor from pinned buffer`);if(!(c.data instanceof I))throw new TypeError(`buffer should be of type ${I.name}`);this.cpuData=c.data;break}case"texture":{if(T!=="float32")throw new TypeError(`unsupported type "${T}" to create tensor from texture`);this.gpuTextureData=c.texture,this.downloader=c.download,this.disposer=c.dispose;break}case"gpu-buffer":{if(T!=="float32"&&T!=="float16"&&T!=="int32"&&T!=="int64"&&T!=="uint32"&&T!=="uint8"&&T!=="bool"&&T!=="uint4"&&T!=="int4")throw new TypeError(`unsupported type "${T}" to create tensor from gpu buffer`);this.gpuBufferData=c.gpuBuffer,this.downloader=c.download,this.disposer=c.dispose;break}case"ml-tensor":{if(T!=="float32"&&T!=="float16"&&T!=="int32"&&T!=="int64"&&T!=="uint32"&&T!=="uint64"&&T!=="int8"&&T!=="uint8"&&T!=="bool"&&T!=="uint4"&&T!=="int4")throw new TypeError(`unsupported type "${T}" to create tensor from MLTensor`);this.mlTensorData=c.mlTensor,this.downloader=c.download,this.disposer=c.dispose;break}default:throw new Error(`Tensor constructor: unsupported location '${this.dataLocation}'`)}else{let I,E;if(typeof c=="string")if(T=c,E=b,c==="string"){if(!Array.isArray(g))throw new TypeError("A string tensor's data must be a string array.");I=g}else{let B=rt.get(c);if(B===void 0)throw new TypeError(`Unsupported tensor type: ${c}.`);if(Array.isArray(g)){if(c==="float16"&&B===Uint16Array||c==="uint4"||c==="int4")throw new TypeError(`Creating a ${c} tensor from number array is not supported. Please use ${B.name} as data.`);c==="uint64"||c==="int64"?I=B.from(g,BigInt):I=B.from(g)}else if(g instanceof B)I=g;else if(g instanceof Uint8ClampedArray)if(c==="uint8")I=Uint8Array.from(g);else throw new TypeError("A Uint8ClampedArray tensor's data must be type of uint8");else if(c==="float16"&&g instanceof Uint16Array&&B!==Uint16Array)I=new globalThis.Float16Array(g.buffer,g.byteOffset,g.length);else throw new TypeError(`A ${T} tensor's data must be type of ${B}`)}else if(E=g,Array.isArray(c)){if(c.length===0)throw new TypeError("Tensor type cannot be inferred from an empty array.");let B=typeof c[0];if(B==="string")T="string",I=c;else if(B==="boolean")T="bool",I=Uint8Array.from(c);else throw new TypeError(`Invalid element type of data array: ${B}.`)}else if(c instanceof Uint8ClampedArray)T="uint8",I=Uint8Array.from(c);else{let B=Bt.get(c.constructor);if(B===void 0)throw new TypeError(`Unsupported type for tensor data: ${c.constructor}.`);T=B,I=c}if(E===void 0)E=[I.length];else if(!Array.isArray(E))throw new TypeError("A tensor's dims must be a number array");$=E,this.cpuData=I,this.dataLocation="cpu"}let R=Ii($);if(this.cpuData&&R!==this.cpuData.length&&!((T==="uint4"||T==="int4")&&Math.ceil(R/2)===this.cpuData.length))throw new Error(`Tensor's size(${R}) does not match data length(${this.cpuData.length}).`);this.type=T,this.dims=$,this.size=R}static async fromImage(c,g){return _t(c,g)}static fromTexture(c,g){return _r(c,g)}static fromGpuBuffer(c,g){return br(c,g)}static fromMLTensor(c,g){return Be(c,g)}static fromPinnedBuffer(c,g,b){return Ct(c,g,b)}toDataURL(c){return He(this,c)}toImageData(c){return mt(this,c)}get data(){if(this.ensureValid(),!this.cpuData)throw new Error("The data is not on CPU. Use `getData()` to download GPU data to CPU, or use `texture` or `gpuBuffer` property to access the GPU data directly.");return this.cpuData}get location(){return this.dataLocation}get texture(){if(this.ensureValid(),!this.gpuTextureData)throw new Error("The data is not stored as a WebGL texture.");return this.gpuTextureData}get gpuBuffer(){if(this.ensureValid(),!this.gpuBufferData)throw new Error("The data is not stored as a WebGPU buffer.");return this.gpuBufferData}get mlTensor(){if(this.ensureValid(),!this.mlTensorData)throw new Error("The data is not stored as a WebNN MLTensor.");return this.mlTensorData}async getData(c){switch(this.ensureValid(),this.dataLocation){case"cpu":case"cpu-pinned":return this.data;case"texture":case"gpu-buffer":case"ml-tensor":{if(!this.downloader)throw new Error("The current tensor is not created with a specified data downloader.");if(this.isDownloading)throw new Error("The current tensor is being downloaded.");try{this.isDownloading=!0;let g=await this.downloader();return this.downloader=void 0,this.dataLocation="cpu",this.cpuData=g,c&&this.disposer&&(this.disposer(),this.disposer=void 0),g}finally{this.isDownloading=!1}}default:throw new Error(`cannot get data from location: ${this.dataLocation}`)}}dispose(){if(this.isDownloading)throw new Error("The current tensor is being downloaded.");this.disposer&&(this.disposer(),this.disposer=void 0),this.cpuData=void 0,this.gpuTextureData=void 0,this.gpuBufferData=void 0,this.mlTensorData=void 0,this.downloader=void 0,this.isDownloading=void 0,this.dataLocation="none"}ensureValid(){if(this.dataLocation==="none")throw new Error("The tensor is disposed.")}reshape(c){if(this.ensureValid(),this.downloader||this.disposer)throw new Error("Cannot reshape a tensor that owns GPU resource.");return ki(this,c)}}}),qe,Ci=C(()=>{$r(),qe=De}),jt,xr,et,Ye,dt,pt,Ai=C(()=>{Ve(),jt=(c,g)=>{(typeof ce.trace>"u"?!ce.wasm.trace:!ce.trace)||console.timeStamp(`${c}::ORT::${g}`)},xr=(c,g)=>{var $;let b=(($=new Error().stack)==null?void 0:$.split(/\r\n|\r|\n/g))||[],T=!1;for(let R=0;R<b.length;R++){if(T&&!b[R].includes("TRACE_FUNC")){let I=`FUNC_${c}::${b[R].trim().split(" ")[1]}`;g&&(I+=`::${g}`),jt("CPU",I);return}b[R].includes("TRACE_FUNC")&&(T=!0)}},et=c=>{(typeof ce.trace>"u"?!ce.wasm.trace:!ce.trace)||xr("BEGIN",c)},Ye=c=>{(typeof ce.trace>"u"?!ce.wasm.trace:!ce.trace)||xr("END",c)},dt=c=>{(typeof ce.trace>"u"?!ce.wasm.trace:!ce.trace)||console.time(`ORT::${c}`)},pt=c=>{(typeof ce.trace>"u"?!ce.wasm.trace:!ce.trace)||console.timeEnd(`ORT::${c}`)}}),zi,rn=C(()=>{wt(),Ci(),Ai(),zi=class vc{constructor(g){this.handler=g}async run(g,b,T){et(),dt("InferenceSession.run");let $={},R={};if(typeof g!="object"||g===null||g instanceof qe||Array.isArray(g))throw new TypeError("'feeds' must be an object that use input names as keys and OnnxValue as corresponding values.");let I=!0;if(typeof b=="object"){if(b===null)throw new TypeError("Unexpected argument[1]: cannot be null.");if(b instanceof qe)throw new TypeError("'fetches' cannot be a Tensor");if(Array.isArray(b)){if(b.length===0)throw new TypeError("'fetches' cannot be an empty array.");I=!1;for(let V of b){if(typeof V!="string")throw new TypeError("'fetches' must be a string array or an object.");if(this.outputNames.indexOf(V)===-1)throw new RangeError(`'fetches' contains invalid output name: ${V}.`);$[V]=null}if(typeof T=="object"&&T!==null)R=T;else if(typeof T<"u")throw new TypeError("'options' must be an object.")}else{let V=!1,G=Object.getOwnPropertyNames(b);for(let j of this.outputNames)if(G.indexOf(j)!==-1){let P=b[j];(P===null||P instanceof qe)&&(V=!0,I=!1,$[j]=P)}if(V){if(typeof T=="object"&&T!==null)R=T;else if(typeof T<"u")throw new TypeError("'options' must be an object.")}else R=b}}else if(typeof b<"u")throw new TypeError("Unexpected argument[1]: must be 'fetches' or 'options'.");for(let V of this.inputNames)if(typeof g[V]>"u")throw new Error(`input '${V}' is missing in 'feeds'.`);if(I)for(let V of this.outputNames)$[V]=null;let E=await this.handler.run(g,$,R),B={};for(let V in E)if(Object.hasOwnProperty.call(E,V)){let G=E[V];G instanceof qe?B[V]=G:B[V]=new qe(G.type,G.data,G.dims)}return pt("InferenceSession.run"),Ye(),B}async release(){return this.handler.dispose()}static async create(g,b,T,$){et(),dt("InferenceSession.create");let R,I={};if(typeof g=="string"){if(R=g,typeof b=="object"&&b!==null)I=b;else if(typeof b<"u")throw new TypeError("'options' must be an object.")}else if(g instanceof Uint8Array){if(R=g,typeof b=="object"&&b!==null)I=b;else if(typeof b<"u")throw new TypeError("'options' must be an object.")}else if(g instanceof ArrayBuffer||typeof SharedArrayBuffer<"u"&&g instanceof SharedArrayBuffer){let G=g,j=0,P=g.byteLength;if(typeof b=="object"&&b!==null)I=b;else if(typeof b=="number"){if(j=b,!Number.isSafeInteger(j))throw new RangeError("'byteOffset' must be an integer.");if(j<0||j>=G.byteLength)throw new RangeError(`'byteOffset' is out of range [0, ${G.byteLength}).`);if(P=g.byteLength-j,typeof T=="number"){if(P=T,!Number.isSafeInteger(P))throw new RangeError("'byteLength' must be an integer.");if(P<=0||j+P>G.byteLength)throw new RangeError(`'byteLength' is out of range (0, ${G.byteLength-j}].`);if(typeof $=="object"&&$!==null)I=$;else if(typeof $<"u")throw new TypeError("'options' must be an object.")}else if(typeof T<"u")throw new TypeError("'byteLength' must be a number.")}else if(typeof b<"u")throw new TypeError("'options' must be an object.");R=new Uint8Array(G,j,P)}else throw new TypeError("Unexpected argument[0]: must be 'path' or 'buffer'.");let[E,B]=await Ke(I),V=await E.createInferenceSessionHandler(R,B);return pt("InferenceSession.create"),Ye(),new vc(V)}startProfiling(){this.handler.startProfiling()}endProfiling(){this.handler.endProfiling()}get inputNames(){return this.handler.inputNames}get outputNames(){return this.handler.outputNames}get inputMetadata(){return this.handler.inputMetadata}get outputMetadata(){return this.handler.outputMetadata}}}),Sr,an=C(()=>{rn(),Sr=zi}),nn=C(()=>{}),sn=C(()=>{}),on=C(()=>{}),un=C(()=>{}),Oi={};ge(Oi,{InferenceSession:()=>Sr,TRACE:()=>jt,TRACE_EVENT_BEGIN:()=>dt,TRACE_EVENT_END:()=>pt,TRACE_FUNC_BEGIN:()=>et,TRACE_FUNC_END:()=>Ye,Tensor:()=>qe,env:()=>re,registerBackend:()=>we});var Je=C(()=>{Rt(),ut(),an(),Ci(),nn(),sn(),Ai(),on(),un()}),Tr=C(()=>{}),Ri={};ge(Ri,{default:()=>Bi});var Er,Ir,Bi,ln=C(()=>{var c;Ji(),bt(),Or(),Er="ort-wasm-proxy-worker",Ir=((c=globalThis.self)==null?void 0:c.name)===Er,Ir&&(self.onmessage=g=>{let{type:b,in:T}=g.data;try{switch(b){case"init-wasm":Mr(T.wasm).then(()=>{si(T).then(()=>{postMessage({type:b})},$=>{postMessage({type:b,err:$})})},$=>{postMessage({type:b,err:$})});break;case"init-ep":{let{epName:$,env:R}=T;oi(R,$).then(()=>{postMessage({type:b})},I=>{postMessage({type:b,err:I})});break}case"copy-from":{let{buffer:$}=T,R=Te($);postMessage({type:b,out:R});break}case"create":{let{model:$,options:R}=T;Et($,R).then(I=>{postMessage({type:b,out:I})},I=>{postMessage({type:b,err:I})});break}case"release":di(T),postMessage({type:b});break;case"run":{let{sessionId:$,inputIndices:R,inputs:I,outputIndices:E,options:B}=T;U($,R,I,E,new Array(E.length).fill(null),B).then(V=>{V.some(G=>G[3]!=="cpu")?postMessage({type:b,err:"Proxy does not support non-cpu tensor location."}):postMessage({type:b,out:V},pi([...I,...V]))},V=>{postMessage({type:b,err:V})});break}case"end-profiling":lr(T),postMessage({type:b});break;default:}}catch($){postMessage({type:b,err:$})}}),Bi=Ir?null:g=>new Worker(g??Pe,{type:"classic",name:Er})}),Mi,Di,Pe,kr,tr,Pi,Ui,Cr,Ni,Ar,Li,zr,Vi,Or=C(()=>{Tr(),Mi=typeof location>"u"?void 0:location.origin,Di=()=>{var c,g;return typeof document<"u"?(c=document.currentScript)==null?void 0:c.src:typeof self<"u"?(g=self.location)==null?void 0:g.href:void 0},Pe=Di(),kr=()=>{if(Pe&&!Pe.startsWith("blob:"))return Pe.substring(0,Pe.lastIndexOf("/")+1)},tr=(c,g)=>{try{let b=g??Pe;return(b?new URL(c,b):new URL(c)).origin===Mi}catch{return!1}},Pi=(c,g)=>{let b=g??Pe;try{return(b?new URL(c,b):new URL(c)).href}catch{return}},Ui=(c,g)=>`${g??"./"}${c}`,Cr=async c=>{let g=await(await fetch(c,{credentials:"same-origin"})).blob();return URL.createObjectURL(g)},Ni=async c=>(await import(c)).default,Ar=(ln(),ze(Ri)).default,Li=async()=>{if(!Pe)throw new Error("Failed to load proxy worker: cannot determine the script source URL.");if(tr(Pe))return[void 0,Ar()];let c=await Cr(Pe);return[c,Ar(c)]},zr=void 0,Vi=async(c,g,b,T)=>{let $=zr&&!(c||g);if($)if(Pe)$=tr(Pe);else if(T&&!b)$=!0;else throw new Error("cannot determine the script source URL.");if($)return[void 0,zr];{let R="ort-wasm-simd-threaded.mjs",I=c??Pi(R,g),E=b&&I&&!tr(I,g),B=E?await Cr(I):I??Ui(R,g);return[E?B:void 0,await Ni(B)]}}}),Rr,rr,Mt,Br,Wi,Fi,qi,Mr,he,bt=C(()=>{Or(),rr=!1,Mt=!1,Br=!1,Wi=()=>{if(typeof SharedArrayBuffer>"u")return!1;try{return typeof MessageChannel<"u"&&new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)),WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,5,4,1,3,1,1,10,11,1,9,0,65,0,254,16,2,0,26,11]))}catch{return!1}},Fi=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,10,30,1,28,0,65,0,253,15,253,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,253,186,1,26,11]))}catch{return!1}},qi=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,19,1,17,0,65,1,253,15,65,2,253,15,65,3,253,15,253,147,2,11]))}catch{return!1}},Mr=async c=>{if(rr)return Promise.resolve();if(Mt)throw new Error("multiple calls to 'initializeWebAssembly()' detected.");if(Br)throw new Error("previous call to 'initializeWebAssembly()' failed.");Mt=!0;let g=c.initTimeout,b=c.numThreads;if(c.simd!==!1){if(c.simd==="relaxed"){if(!qi())throw new Error("Relaxed WebAssembly SIMD is not supported in the current environment.")}else if(!Fi())throw new Error("WebAssembly SIMD is not supported in the current environment.")}let T=Wi();b>1&&!T&&(typeof self<"u"&&!self.crossOriginIsolated&&console.warn("env.wasm.numThreads is set to "+b+", but this will not work unless you enable crossOriginIsolated mode. See https://web.dev/cross-origin-isolation-guide/ for more info."),console.warn("WebAssembly multi-threading is not supported in the current environment. Falling back to single-threading."),c.numThreads=b=1);let $=c.wasmPaths,R=typeof $=="string"?$:void 0,I=$==null?void 0:$.mjs,E=(I==null?void 0:I.href)??I,B=$==null?void 0:$.wasm,V=(B==null?void 0:B.href)??B,G=c.wasmBinary,[j,P]=await Vi(E,R,b>1,!!G||!!V),ee=!1,O=[];if(g>0&&O.push(new Promise(Z=>{setTimeout(()=>{ee=!0,Z()},g)})),O.push(new Promise((Z,Le)=>{let _e={numThreads:b};if(G)_e.wasmBinary=G;else if(V||R)_e.locateFile=ye=>V??R+ye;else if(E&&E.indexOf("blob:")!==0)_e.locateFile=ye=>new URL(ye,E).href;else if(j){let ye=kr();ye&&(_e.locateFile=Me=>ye+Me)}P(_e).then(ye=>{Mt=!1,rr=!0,Rr=ye,Z(),j&&URL.revokeObjectURL(j)},ye=>{Mt=!1,Br=!0,Le(ye)})})),await Promise.race(O),ee)throw new Error(`WebAssembly backend initializing failed due to timeout: ${g}ms`)},he=()=>{if(rr&&Rr)return Rr;throw new Error("WebAssembly is not initialized yet.")}}),Ge,ir,le,Dr=C(()=>{bt(),Ge=(c,g)=>{let b=he(),T=b.lengthBytesUTF8(c)+1,$=b._malloc(T);return b.stringToUTF8(c,$,T),g.push($),$},ir=(c,g,b,T)=>{if(typeof c=="object"&&c!==null){if(b.has(c))throw new Error("Circular reference in options");b.add(c)}Object.entries(c).forEach(([$,R])=>{let I=g?g+$:$;if(typeof R=="object")ir(R,I+".",b,T);else if(typeof R=="string"||typeof R=="number")T(I,R.toString());else if(typeof R=="boolean")T(I,R?"1":"0");else throw new Error(`Can't handle extra config type: ${typeof R}`)})},le=c=>{let g=he(),b=g.stackSave();try{let T=g.PTR_SIZE,$=g.stackAlloc(2*T);g._OrtGetLastError($,$+T);let R=Number(g.getValue($,T===4?"i32":"i64")),I=g.getValue($+T,"*"),E=I?g.UTF8ToString(I):"";throw new Error(`${c} ERROR_CODE: ${R}, ERROR_MESSAGE: ${E}`)}finally{g.stackRestore(b)}}}),Gi,dn=C(()=>{bt(),Dr(),Gi=c=>{let g=he(),b=0,T=[],$=c||{};try{if((c==null?void 0:c.logSeverityLevel)===void 0)$.logSeverityLevel=2;else if(typeof c.logSeverityLevel!="number"||!Number.isInteger(c.logSeverityLevel)||c.logSeverityLevel<0||c.logSeverityLevel>4)throw new Error(`log severity level is not valid: ${c.logSeverityLevel}`);if((c==null?void 0:c.logVerbosityLevel)===void 0)$.logVerbosityLevel=0;else if(typeof c.logVerbosityLevel!="number"||!Number.isInteger(c.logVerbosityLevel))throw new Error(`log verbosity level is not valid: ${c.logVerbosityLevel}`);(c==null?void 0:c.terminate)===void 0&&($.terminate=!1);let R=0;return(c==null?void 0:c.tag)!==void 0&&(R=Ge(c.tag,T)),b=g._OrtCreateRunOptions($.logSeverityLevel,$.logVerbosityLevel,!!$.terminate,R),b===0&&le("Can't create run options."),(c==null?void 0:c.extra)!==void 0&&ir(c.extra,"",new WeakSet,(I,E)=>{let B=Ge(I,T),V=Ge(E,T);g._OrtAddRunConfigEntry(b,B,V)!==0&&le(`Can't set a run config entry: ${I} - ${E}.`)}),[b,T]}catch(R){throw b!==0&&g._OrtReleaseRunOptions(b),T.forEach(I=>g._free(I)),R}}}),Hi,ji,Ki,Dt,Zi,Qi,pn=C(()=>{bt(),Dr(),Hi=c=>{switch(c){case"disabled":return 0;case"basic":return 1;case"extended":return 2;case"layout":return 3;case"all":return 99;default:throw new Error(`unsupported graph optimization level: ${c}`)}},ji=c=>{switch(c){case"sequential":return 0;case"parallel":return 1;default:throw new Error(`unsupported execution mode: ${c}`)}},Ki=c=>{c.extra||(c.extra={}),c.extra.session||(c.extra.session={});let g=c.extra.session;g.use_ort_model_bytes_directly||(g.use_ort_model_bytes_directly="1"),c.executionProviders&&c.executionProviders.some(b=>(typeof b=="string"?b:b.name)==="webgpu")&&(c.enableMemPattern=!1)},Dt=(c,g,b,T)=>{let $=Ge(g,T),R=Ge(b,T);he()._OrtAddSessionConfigEntry(c,$,R)!==0&&le(`Can't set a session config entry: ${g} - ${b}.`)},Zi=async(c,g,b)=>{for(let T of g){let $=typeof T=="string"?T:T.name,R=[];switch($){case"webnn":if($="WEBNN",typeof T!="string"){let G=T==null?void 0:T.deviceType;G&&Dt(c,"deviceType",G,b)}break;case"webgpu":if($="JS",typeof T!="string"){let G=T;if(G!=null&&G.preferredLayout){if(G.preferredLayout!=="NCHW"&&G.preferredLayout!=="NHWC")throw new Error(`preferredLayout must be either 'NCHW' or 'NHWC': ${G.preferredLayout}`);Dt(c,"preferredLayout",G.preferredLayout,b)}}break;case"wasm":case"cpu":continue;default:throw new Error(`not supported execution provider: ${$}`)}let I=Ge($,b),E=R.length,B=0,V=0;if(E>0){B=he()._malloc(E*he().PTR_SIZE),b.push(B),V=he()._malloc(E*he().PTR_SIZE),b.push(V);for(let G=0;G<E;G++)he().setValue(B+G*he().PTR_SIZE,R[G][0],"*"),he().setValue(V+G*he().PTR_SIZE,R[G][1],"*")}await he()._OrtAppendExecutionProvider(c,I,B,V,E)!==0&&le(`Can't append execution provider: ${$}.`)}},Qi=async c=>{let g=he(),b=0,T=[],$=c||{};Ki($);try{let R=Hi($.graphOptimizationLevel??"all"),I=ji($.executionMode??"sequential"),E=typeof $.logId=="string"?Ge($.logId,T):0,B=$.logSeverityLevel??2;if(!Number.isInteger(B)||B<0||B>4)throw new Error(`log severity level is not valid: ${B}`);let V=$.logVerbosityLevel??0;if(!Number.isInteger(V)||V<0||V>4)throw new Error(`log verbosity level is not valid: ${V}`);let G=typeof $.optimizedModelFilePath=="string"?Ge($.optimizedModelFilePath,T):0;if(b=g._OrtCreateSessionOptions(R,!!$.enableCpuMemArena,!!$.enableMemPattern,I,!!$.enableProfiling,0,E,B,V,G),b===0&&le("Can't create session options."),$.executionProviders&&await Zi(b,$.executionProviders,T),$.enableGraphCapture!==void 0){if(typeof $.enableGraphCapture!="boolean")throw new Error(`enableGraphCapture must be a boolean value: ${$.enableGraphCapture}`);Dt(b,"enableGraphCapture",$.enableGraphCapture.toString(),T)}if($.freeDimensionOverrides)for(let[j,P]of Object.entries($.freeDimensionOverrides)){if(typeof j!="string")throw new Error(`free dimension override name must be a string: ${j}`);if(typeof P!="number"||!Number.isInteger(P)||P<0)throw new Error(`free dimension override value must be a non-negative integer: ${P}`);let ee=Ge(j,T);g._OrtAddFreeDimensionOverride(b,ee,P)!==0&&le(`Can't set a free dimension override: ${j} - ${P}.`)}return $.extra!==void 0&&ir($.extra,"",new WeakSet,(j,P)=>{Dt(b,j,P,T)}),[b,T]}catch(R){throw b!==0&&g._OrtReleaseSessionOptions(b)!==0&&le("Can't release session options."),T.forEach(I=>g._free(I)),R}}}),vt,$t,xt,Pr,Ur,Nr,Lr,ni,pe=C(()=>{vt=c=>{switch(c){case"int8":return 3;case"uint8":return 2;case"bool":return 9;case"int16":return 5;case"uint16":return 4;case"int32":return 6;case"uint32":return 12;case"float16":return 10;case"float32":return 1;case"float64":return 11;case"string":return 8;case"int64":return 7;case"uint64":return 13;case"int4":return 22;case"uint4":return 21;default:throw new Error(`unsupported data type: ${c}`)}},$t=c=>{switch(c){case 3:return"int8";case 2:return"uint8";case 9:return"bool";case 5:return"int16";case 4:return"uint16";case 6:return"int32";case 12:return"uint32";case 10:return"float16";case 1:return"float32";case 11:return"float64";case 8:return"string";case 7:return"int64";case 13:return"uint64";case 22:return"int4";case 21:return"uint4";default:throw new Error(`unsupported data type: ${c}`)}},xt=(c,g)=>{let b=[-1,4,1,1,2,2,4,8,-1,1,2,8,4,8,-1,-1,-1,-1,-1,-1,-1,.5,.5][c],T=typeof g=="number"?g:g.reduce(($,R)=>$*R,1);return b>0?Math.ceil(T*b):void 0},Pr=c=>{switch(c){case"float16":return typeof Float16Array<"u"&&Float16Array.from?Float16Array:Uint16Array;case"float32":return Float32Array;case"uint8":return Uint8Array;case"int8":return Int8Array;case"uint16":return Uint16Array;case"int16":return Int16Array;case"int32":return Int32Array;case"bool":return Uint8Array;case"float64":return Float64Array;case"uint32":return Uint32Array;case"int64":return BigInt64Array;case"uint64":return BigUint64Array;default:throw new Error(`unsupported type: ${c}`)}},Ur=c=>{switch(c){case"verbose":return 0;case"info":return 1;case"warning":return 2;case"error":return 3;case"fatal":return 4;default:throw new Error(`unsupported logging level: ${c}`)}},Nr=c=>c==="float32"||c==="float16"||c==="int32"||c==="int64"||c==="uint32"||c==="uint8"||c==="bool"||c==="uint4"||c==="int4",Lr=c=>c==="float32"||c==="float16"||c==="int32"||c==="int64"||c==="uint32"||c==="uint64"||c==="int8"||c==="uint8"||c==="bool"||c==="uint4"||c==="int4",ni=c=>{switch(c){case"none":return 0;case"cpu":return 1;case"cpu-pinned":return 2;case"texture":return 3;case"gpu-buffer":return 4;case"ml-tensor":return 5;default:throw new Error(`unsupported data location: ${c}`)}}}),Vr,Xi=C(()=>{Tr(),Vr=async c=>{if(typeof c=="string"){let g=await fetch(c);if(!g.ok)throw new Error(`failed to load external data file: ${c}`);let b=g.headers.get("Content-Length"),T=b?parseInt(b,10):0;if(T<1073741824)return new Uint8Array(await g.arrayBuffer());{if(!g.body)throw new Error(`failed to load external data file: ${c}, no response body.`);let $=g.body.getReader(),R;try{R=new ArrayBuffer(T)}catch(E){if(E instanceof RangeError){let B=Math.ceil(T/65536);R=new WebAssembly.Memory({initial:B,maximum:B}).buffer}else throw E}let I=0;for(;;){let{done:E,value:B}=await $.read();if(E)break;let V=B.byteLength;new Uint8Array(R,I,V).set(B),I+=V}return new Uint8Array(R,0,T)}}else return c instanceof Blob?new Uint8Array(await c.arrayBuffer()):c instanceof Uint8Array?c:new Uint8Array(c)}}),Yi,si,oi,Kt,ui,li,Te,Et,di,Zt,U,lr,pi,Ji=C(()=>{Je(),dn(),pn(),pe(),bt(),Dr(),Xi(),Yi=(c,g)=>{he()._OrtInit(c,g)!==0&&le("Can't initialize onnxruntime.")},si=async c=>{Yi(c.wasm.numThreads,Ur(c.logLevel))},oi=async(c,g)=>{var T,$;($=(T=he()).asyncInit)==null||$.call(T);let b=c.webgpu.adapter;if(g==="webgpu"){if(typeof navigator>"u"||!navigator.gpu)throw new Error("WebGPU is not supported in current environment");if(b){if(typeof b.limits!="object"||typeof b.features!="object"||typeof b.requestDevice!="function")throw new Error("Invalid GPU adapter set in `env.webgpu.adapter`. It must be a GPUAdapter object.")}else{let R=c.webgpu.powerPreference;if(R!==void 0&&R!=="low-power"&&R!=="high-performance")throw new Error(`Invalid powerPreference setting: "${R}"`);let I=c.webgpu.forceFallbackAdapter;if(I!==void 0&&typeof I!="boolean")throw new Error(`Invalid forceFallbackAdapter setting: "${I}"`);if(b=await navigator.gpu.requestAdapter({powerPreference:R,forceFallbackAdapter:I}),!b)throw new Error('Failed to get GPU adapter. You may need to enable flag "--enable-unsafe-webgpu" if you are using Chrome.')}}if(g==="webnn"&&(typeof navigator>"u"||!navigator.ml))throw new Error("WebNN is not supported in current environment")},Kt=new Map,ui=c=>{let g=he(),b=g.stackSave();try{let T=g.PTR_SIZE,$=g.stackAlloc(2*T);g._OrtGetInputOutputCount(c,$,$+T)!==0&&le("Can't get session input/output count.");let R=T===4?"i32":"i64";return[Number(g.getValue($,R)),Number(g.getValue($+T,R))]}finally{g.stackRestore(b)}},li=(c,g)=>{let b=he(),T=b.stackSave(),$=0;try{let R=b.PTR_SIZE,I=b.stackAlloc(2*R);b._OrtGetInputOutputMetadata(c,g,I,I+R)!==0&&le("Can't get session input/output metadata.");let E=Number(b.getValue(I,"*"));$=Number(b.getValue(I+R,"*"));let B=b.HEAP32[$/4];if(B===0)return[E,0];let V=b.HEAPU32[$/4+1],G=[];for(let j=0;j<V;j++){let P=Number(b.getValue($+8+j*R,"*"));G.push(P!==0?b.UTF8ToString(P):Number(b.getValue($+8+(j+V)*R,"*")))}return[E,B,G]}finally{b.stackRestore(T),$!==0&&b._OrtFree($)}},Te=c=>{let g=he(),b=g._malloc(c.byteLength);if(b===0)throw new Error(`Can't create a session. failed to allocate a buffer of size ${c.byteLength}.`);return g.HEAPU8.set(c,b),[b,c.byteLength]},Et=async(c,g)=>{var G,j,P;let b,T,$=he();Array.isArray(c)?[b,T]=c:c.buffer===$.HEAPU8.buffer?[b,T]=[c.byteOffset,c.byteLength]:[b,T]=Te(c);let R=0,I=0,E=[],B=[],V=[];try{if([I,E]=await Qi(g),(g==null?void 0:g.externalData)&&$.mountExternalData){let Ue=[];for(let Ce of g.externalData){let tt=typeof Ce=="string"?Ce:Ce.path;Ue.push(Vr(typeof Ce=="string"?Ce:Ce.data).then(it=>{$.mountExternalData(tt,it)}))}await Promise.all(Ue)}for(let Ue of(g==null?void 0:g.executionProviders)??[])if((typeof Ue=="string"?Ue:Ue.name)==="webnn"){if($.shouldTransferToMLTensor=!1,typeof Ue!="string"){let Ce=Ue,tt=Ce==null?void 0:Ce.context,it=Ce==null?void 0:Ce.gpuDevice,gt=Ce==null?void 0:Ce.deviceType,Gr=Ce==null?void 0:Ce.powerPreference;tt?$.currentContext=tt:it?$.currentContext=await $.webnnCreateMLContext(it):$.currentContext=await $.webnnCreateMLContext({deviceType:gt,powerPreference:Gr})}else $.currentContext=await $.webnnCreateMLContext();break}R=await $._OrtCreateSession(b,T,I),(G=$.webgpuOnCreateSession)==null||G.call($,R),R===0&&le("Can't create a session."),(j=$.jsepOnCreateSession)==null||j.call($),$.currentContext&&($.webnnRegisterMLContext(R,$.currentContext),$.currentContext=void 0,$.shouldTransferToMLTensor=!0);let[ee,O]=ui(R),Z=!!(g!=null&&g.enableGraphCapture),Le=[],_e=[],ye=[],Me=[],ie=[];for(let Ue=0;Ue<ee;Ue++){let[Ce,tt,it]=li(R,Ue);Ce===0&&le("Can't get an input name."),B.push(Ce);let gt=$.UTF8ToString(Ce);Le.push(gt),ye.push(tt===0?{name:gt,isTensor:!1}:{name:gt,isTensor:!0,type:$t(tt),shape:it})}for(let Ue=0;Ue<O;Ue++){let[Ce,tt,it]=li(R,Ue+ee);Ce===0&&le("Can't get an output name."),V.push(Ce);let gt=$.UTF8ToString(Ce);_e.push(gt),Me.push(tt===0?{name:gt,isTensor:!1}:{name:gt,isTensor:!0,type:$t(tt),shape:it})}return Kt.set(R,[R,B,V,null,Z,!1]),[R,Le,_e,ye,Me]}catch(ee){throw B.forEach(O=>$._OrtFree(O)),V.forEach(O=>$._OrtFree(O)),R!==0&&$._OrtReleaseSession(R)!==0&&le("Can't release session."),ee}finally{$._free(b),I!==0&&$._OrtReleaseSessionOptions(I)!==0&&le("Can't release session options."),E.forEach(ee=>$._free(ee)),(P=$.unmountExternalData)==null||P.call($)}},di=c=>{var B,V,G;let g=he(),b=Kt.get(c);if(!b)throw new Error(`cannot release session. invalid session id: ${c}`);let[T,$,R,I,E]=b;I&&(E&&g._OrtClearBoundOutputs(I.handle)!==0&&le("Can't clear bound outputs."),g._OrtReleaseBinding(I.handle)!==0&&le("Can't release IO binding.")),(B=g.jsepOnReleaseSession)==null||B.call(g,c),(V=g.webnnOnReleaseSession)==null||V.call(g,c),(G=g.webgpuOnReleaseSession)==null||G.call(g,c),$.forEach(j=>g._OrtFree(j)),R.forEach(j=>g._OrtFree(j)),g._OrtReleaseSession(T)!==0&&le("Can't release session."),Kt.delete(c)},Zt=async(c,g,b,T,$,R,I=!1)=>{if(!c){g.push(0);return}let E=he(),B=E.PTR_SIZE,V=c[0],G=c[1],j=c[3],P=j,ee,O;if(V==="string"&&(j==="gpu-buffer"||j==="ml-tensor"))throw new Error("String tensor is not supported on GPU.");if(I&&j!=="gpu-buffer")throw new Error(`External buffer must be provided for input/output index ${R} when enableGraphCapture is true.`);if(j==="gpu-buffer"){let _e=c[2].gpuBuffer;O=xt(vt(V),G);{let ye=E.jsepRegisterBuffer;if(!ye)throw new Error('Tensor location "gpu-buffer" is not supported without using WebGPU.');ee=ye(T,R,_e,O)}}else if(j==="ml-tensor"){let _e=c[2].mlTensor;O=xt(vt(V),G);let ye=E.webnnRegisterMLTensor;if(!ye)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');ee=ye(T,_e,vt(V),G)}else{let _e=c[2];if(Array.isArray(_e)){O=B*_e.length,ee=E._malloc(O),b.push(ee);for(let ye=0;ye<_e.length;ye++){if(typeof _e[ye]!="string")throw new TypeError(`tensor data at index ${ye} is not a string`);E.setValue(ee+ye*B,Ge(_e[ye],b),"*")}}else{let ye=E.webnnIsGraphInput,Me=E.webnnIsGraphOutput;if(V!=="string"&&ye&&Me){let ie=E.UTF8ToString($);if(ye(T,ie)||Me(T,ie)){let Ue=vt(V);O=xt(Ue,G),P="ml-tensor";let Ce=E.webnnCreateTemporaryTensor,tt=E.webnnUploadTensor;if(!Ce||!tt)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');let it=await Ce(T,Ue,G);tt(it,new Uint8Array(_e.buffer,_e.byteOffset,_e.byteLength)),ee=it}else O=_e.byteLength,ee=E._malloc(O),b.push(ee),E.HEAPU8.set(new Uint8Array(_e.buffer,_e.byteOffset,O),ee)}else O=_e.byteLength,ee=E._malloc(O),b.push(ee),E.HEAPU8.set(new Uint8Array(_e.buffer,_e.byteOffset,O),ee)}}let Z=E.stackSave(),Le=E.stackAlloc(4*G.length);try{G.forEach((ye,Me)=>E.setValue(Le+Me*B,ye,B===4?"i32":"i64"));let _e=E._OrtCreateTensor(vt(V),ee,O,Le,G.length,ni(P));_e===0&&le(`Can't create tensor for input/output. session=${T}, index=${R}.`),g.push(_e)}finally{E.stackRestore(Z)}},U=async(c,g,b,T,$,R)=>{var Gr,ct,oa;let I=he(),E=I.PTR_SIZE,B=Kt.get(c);if(!B)throw new Error(`cannot run inference. invalid session id: ${c}`);let V=B[0],G=B[1],j=B[2],P=B[3],ee=B[4];B[5];let O=g.length,Z=T.length,Le=0,_e=[],ye=[],Me=[],ie=[],Ue=I.stackSave(),Ce=I.stackAlloc(O*E),tt=I.stackAlloc(O*E),it=I.stackAlloc(Z*E),gt=I.stackAlloc(Z*E);try{[Le,_e]=Gi(R),dt("wasm prepareInputOutputTensor");for(let Ee=0;Ee<O;Ee++)await Zt(b[Ee],ye,ie,c,G[g[Ee]],g[Ee],ee);for(let Ee=0;Ee<Z;Ee++)await Zt($[Ee],Me,ie,c,j[T[Ee]],O+T[Ee],ee);pt("wasm prepareInputOutputTensor");for(let Ee=0;Ee<O;Ee++)I.setValue(Ce+Ee*E,ye[Ee],"*"),I.setValue(tt+Ee*E,G[g[Ee]],"*");for(let Ee=0;Ee<Z;Ee++)I.setValue(it+Ee*E,Me[Ee],"*"),I.setValue(gt+Ee*E,j[T[Ee]],"*");(Gr=I.jsepOnRunStart)==null||Gr.call(I,V),(ct=I.webnnOnRunStart)==null||ct.call(I,V);let It;It=await I._OrtRun(V,tt,Ce,O,gt,Z,it,Le),It!==0&&le("failed to call OrtRun().");let at=[],ua=[];dt("wasm ProcessOutputTensor");for(let Ee=0;Ee<Z;Ee++){let Nt=Number(I.getValue(it+Ee*E,"*"));if(Nt===Me[Ee]){at.push($[Ee]);continue}let za=I.stackSave(),Lt=I.stackAlloc(4*E),Hr=!1,Ze,ht=0;try{I._OrtGetTensorData(Nt,Lt,Lt+E,Lt+2*E,Lt+3*E)!==0&&le(`Can't access output tensor data on index ${Ee}.`);let vi=E===4?"i32":"i64",jr=Number(I.getValue(Lt,vi));ht=I.getValue(Lt+E,"*");let St=I.getValue(Lt+E*2,"*"),Oa=Number(I.getValue(Lt+E*3,vi)),Vt=[];for(let Qe=0;Qe<Oa;Qe++)Vt.push(Number(I.getValue(St+Qe*E,vi)));I._OrtFree(St)!==0&&le("Can't free memory for tensor dims.");let Wt=Vt.reduce((Qe,Fe)=>Qe*Fe,1);Ze=$t(jr);let hr=P==null?void 0:P.outputPreferredLocations[T[Ee]];if(Ze==="string"){if(hr==="gpu-buffer"||hr==="ml-tensor")throw new Error("String tensor is not supported on GPU.");let Qe=[];for(let Fe=0;Fe<Wt;Fe++){let At=I.getValue(ht+Fe*E,"*"),Ra=I.getValue(ht+(Fe+1)*E,"*"),Ba=Fe===Wt-1?void 0:Ra-At;Qe.push(I.UTF8ToString(At,Ba))}at.push([Ze,Vt,Qe,"cpu"])}else if(hr==="gpu-buffer"&&Wt>0){let Qe=I.jsepGetBuffer;if(!Qe)throw new Error('preferredLocation "gpu-buffer" is not supported without using WebGPU.');let Fe=Qe(ht),At=xt(jr,Wt);if(At===void 0||!Nr(Ze))throw new Error(`Unsupported data type: ${Ze}`);Hr=!0,at.push([Ze,Vt,{gpuBuffer:Fe,download:I.jsepCreateDownloader(Fe,At,Ze),dispose:()=>{I._OrtReleaseTensor(Nt)!==0&&le("Can't release tensor.")}},"gpu-buffer"])}else if(hr==="ml-tensor"&&Wt>0){let Qe=I.webnnEnsureTensor,Fe=I.webnnIsGraphInputOutputTypeSupported;if(!Qe||!Fe)throw new Error('preferredLocation "ml-tensor" is not supported without using WebNN.');if(xt(jr,Wt)===void 0||!Lr(Ze))throw new Error(`Unsupported data type: ${Ze}`);if(!Fe(c,Ze,!1))throw new Error(`preferredLocation "ml-tensor" for ${Ze} output is not supported by current WebNN Context.`);let At=await Qe(c,ht,jr,Vt,!1);Hr=!0,at.push([Ze,Vt,{mlTensor:At,download:I.webnnCreateMLTensorDownloader(ht,Ze),dispose:()=>{I.webnnReleaseTensorId(ht),I._OrtReleaseTensor(Nt)}},"ml-tensor"])}else if(hr==="ml-tensor-cpu-output"&&Wt>0){let Qe=I.webnnCreateMLTensorDownloader(ht,Ze)(),Fe=at.length;Hr=!0,ua.push((async()=>{let At=[Fe,await Qe];return I.webnnReleaseTensorId(ht),I._OrtReleaseTensor(Nt),At})()),at.push([Ze,Vt,[],"cpu"])}else{let Qe=Pr(Ze),Fe=new Qe(Wt);new Uint8Array(Fe.buffer,Fe.byteOffset,Fe.byteLength).set(I.HEAPU8.subarray(ht,ht+Fe.byteLength)),at.push([Ze,Vt,Fe,"cpu"])}}finally{I.stackRestore(za),Ze==="string"&&ht&&I._free(ht),Hr||I._OrtReleaseTensor(Nt)}}P&&!ee&&(I._OrtClearBoundOutputs(P.handle)!==0&&le("Can't clear bound outputs."),Kt.set(c,[V,G,j,P,ee,!1]));for(let[Ee,Nt]of await Promise.all(ua))at[Ee][2]=Nt;return pt("wasm ProcessOutputTensor"),at}finally{(oa=I.webnnOnRunEnd)==null||oa.call(I,V),I.stackRestore(Ue),ye.forEach(It=>I._OrtReleaseTensor(It)),Me.forEach(It=>I._OrtReleaseTensor(It)),ie.forEach(It=>I._free(It)),Le!==0&&I._OrtReleaseRunOptions(Le),_e.forEach(It=>I._free(It))}},lr=c=>{let g=he(),b=Kt.get(c);if(!b)throw new Error("invalid session id");let T=b[0],$=g._OrtEndProfiling(T);$===0&&le("Can't get an profile file name."),g._OrtFree($)},pi=c=>{let g=[];for(let b of c){let T=b[2];!Array.isArray(T)&&"buffer"in T&&g.push(T.buffer)}return g}}),Pt,ne,Qt,dr,ar,pr,Wr,Fr,Ut,Xt,ci,hi,fi,ea,ta,Ca,cr,ra,ia=C(()=>{Je(),Ji(),bt(),Or(),Pt=()=>!!re.wasm.proxy&&typeof document<"u",Qt=!1,dr=!1,ar=!1,Fr=new Map,Ut=(c,g)=>{let b=Fr.get(c);b?b.push(g):Fr.set(c,[g])},Xt=()=>{if(Qt||!dr||ar||!ne)throw new Error("worker not ready")},ci=c=>{switch(c.data.type){case"init-wasm":Qt=!1,c.data.err?(ar=!0,Wr[1](c.data.err)):(dr=!0,Wr[0]()),pr&&(URL.revokeObjectURL(pr),pr=void 0);break;case"init-ep":case"copy-from":case"create":case"release":case"run":case"end-profiling":{let g=Fr.get(c.data.type);c.data.err?g.shift()[1](c.data.err):g.shift()[0](c.data.out);break}}},hi=async()=>{if(!dr){if(Qt)throw new Error("multiple calls to 'initWasm()' detected.");if(ar)throw new Error("previous call to 'initWasm()' failed.");if(Qt=!0,Pt())return new Promise((c,g)=>{ne==null||ne.terminate(),Li().then(([b,T])=>{try{ne=T,ne.onerror=R=>g(R),ne.onmessage=ci,Wr=[c,g];let $={type:"init-wasm",in:re};if(!$.in.wasm.wasmPaths&&b){let R=kr();R&&($.in.wasm.wasmPaths=R)}ne.postMessage($),pr=b}catch($){g($)}},g)});try{await Mr(re.wasm),await si(re),dr=!0}catch(c){throw ar=!0,c}finally{Qt=!1}}},fi=async c=>{if(Pt())return Xt(),new Promise((g,b)=>{Ut("init-ep",[g,b]);let T={type:"init-ep",in:{epName:c,env:re}};ne.postMessage(T)});await oi(re,c)},ea=async c=>Pt()?(Xt(),new Promise((g,b)=>{Ut("copy-from",[g,b]);let T={type:"copy-from",in:{buffer:c}};ne.postMessage(T,[c.buffer])})):Te(c),ta=async(c,g)=>{if(Pt()){if(g!=null&&g.preferredOutputLocation)throw new Error('session option "preferredOutputLocation" is not supported for proxy.');return Xt(),new Promise((b,T)=>{Ut("create",[b,T]);let $={type:"create",in:{model:c,options:{...g}}},R=[];c instanceof Uint8Array&&R.push(c.buffer),ne.postMessage($,R)})}else return Et(c,g)},Ca=async c=>{if(Pt())return Xt(),new Promise((g,b)=>{Ut("release",[g,b]);let T={type:"release",in:c};ne.postMessage(T)});di(c)},cr=async(c,g,b,T,$,R)=>{if(Pt()){if(b.some(I=>I[3]!=="cpu"))throw new Error("input tensor on GPU is not supported for proxy.");if($.some(I=>I))throw new Error("pre-allocated output tensor is not supported for proxy.");return Xt(),new Promise((I,E)=>{Ut("run",[I,E]);let B=b,V={type:"run",in:{sessionId:c,inputIndices:g,inputs:B,outputIndices:T,options:R}};ne.postMessage(V,pi(B))})}else return U(c,g,b,T,$,R)},ra=async c=>{if(Pt())return Xt(),new Promise((g,b)=>{Ut("end-profiling",[g,b]);let T={type:"end-profiling",in:c};ne.postMessage(T)});lr(c)}}),aa,mi,gi,yi=C(()=>{Je(),ia(),pe(),Tr(),Xi(),aa=(c,g)=>{switch(c.location){case"cpu":return[c.type,c.dims,c.data,"cpu"];case"gpu-buffer":return[c.type,c.dims,{gpuBuffer:c.gpuBuffer},"gpu-buffer"];case"ml-tensor":return[c.type,c.dims,{mlTensor:c.mlTensor},"ml-tensor"];default:throw new Error(`invalid data location: ${c.location} for ${g()}`)}},mi=c=>{switch(c[3]){case"cpu":return new qe(c[0],c[2],c[1]);case"gpu-buffer":{let g=c[0];if(!Nr(g))throw new Error(`not supported data type: ${g} for deserializing GPU tensor`);let{gpuBuffer:b,download:T,dispose:$}=c[2];return qe.fromGpuBuffer(b,{dataType:g,dims:c[1],download:T,dispose:$})}case"ml-tensor":{let g=c[0];if(!Lr(g))throw new Error(`not supported data type: ${g} for deserializing MLTensor tensor`);let{mlTensor:b,download:T,dispose:$}=c[2];return qe.fromMLTensor(b,{dataType:g,dims:c[1],download:T,dispose:$})}default:throw new Error(`invalid data location: ${c[3]}`)}},gi=class{async fetchModelAndCopyToWasmMemory(c){return ea(await Vr(c))}async loadModel(c,g){et();let b;typeof c=="string"?b=await this.fetchModelAndCopyToWasmMemory(c):b=c,[this.sessionId,this.inputNames,this.outputNames,this.inputMetadata,this.outputMetadata]=await ta(b,g),Ye()}async dispose(){return Ca(this.sessionId)}async run(c,g,b){et();let T=[],$=[];Object.entries(c).forEach(j=>{let P=j[0],ee=j[1],O=this.inputNames.indexOf(P);if(O===-1)throw new Error(`invalid input '${P}'`);T.push(ee),$.push(O)});let R=[],I=[];Object.entries(g).forEach(j=>{let P=j[0],ee=j[1],O=this.outputNames.indexOf(P);if(O===-1)throw new Error(`invalid output '${P}'`);R.push(ee),I.push(O)});let E=T.map((j,P)=>aa(j,()=>`input "${this.inputNames[$[P]]}"`)),B=R.map((j,P)=>j?aa(j,()=>`output "${this.outputNames[I[P]]}"`):null),V=await cr(this.sessionId,$,E,I,B,b),G={};for(let j=0;j<V.length;j++)G[this.outputNames[I[j]]]=R[j]??mi(V[j]);return Ye(),G}startProfiling(){}endProfiling(){ra(this.sessionId)}}}),qr={};ge(qr,{OnnxruntimeWebAssemblyBackend:()=>_i,initializeFlags:()=>wi,wasmBackend:()=>bi});var wi,_i,bi,na=C(()=>{Je(),ia(),yi(),wi=()=>{(typeof re.wasm.initTimeout!="number"||re.wasm.initTimeout<0)&&(re.wasm.initTimeout=0);let c=re.wasm.simd;if(typeof c!="boolean"&&c!==void 0&&c!=="fixed"&&c!=="relaxed"&&(console.warn(`Property "env.wasm.simd" is set to unknown value "${c}". Reset it to \`false\` and ignore SIMD feature checking.`),re.wasm.simd=!1),typeof re.wasm.proxy!="boolean"&&(re.wasm.proxy=!1),typeof re.wasm.trace!="boolean"&&(re.wasm.trace=!1),typeof re.wasm.numThreads!="number"||!Number.isInteger(re.wasm.numThreads)||re.wasm.numThreads<=0)if(typeof self<"u"&&!self.crossOriginIsolated)re.wasm.numThreads=1;else{let g=typeof navigator>"u"?J("node:os").cpus().length:navigator.hardwareConcurrency;re.wasm.numThreads=Math.min(4,Math.ceil((g||1)/2))}},_i=class{async init(c){wi(),await hi(),await fi(c)}async createInferenceSessionHandler(c,g){let b=new gi;return await b.loadModel(c,g),b}},bi=new _i}),sa={};ge(sa,{InferenceSession:()=>Sr,TRACE:()=>jt,TRACE_EVENT_BEGIN:()=>dt,TRACE_EVENT_END:()=>pt,TRACE_FUNC_BEGIN:()=>et,TRACE_FUNC_END:()=>Ye,Tensor:()=>qe,default:()=>cn,env:()=>re,registerBackend:()=>we}),Je(),Je(),Je();var Aa="1.23.2",cn=Oi;{let c=(na(),ze(qr)).wasmBackend;we("cpu",c,10),we("wasm",c,10)}return Object.defineProperty(re.versions,"web",{value:Aa,enumerable:!0}),ze(sa)})();k.exports=L})(bc);var Dh=bc.exports;(function(k){var A=ft&&ft.__createBinding||(Object.create?function(Ie,ke,me,ce){ce===void 0&&(ce=me);var Ve=Object.getOwnPropertyDescriptor(ke,me);(!Ve||("get"in Ve?!ke.__esModule:Ve.writable||Ve.configurable))&&(Ve={enumerable:!0,get:function(){return ke[me]}}),Object.defineProperty(Ie,ce,Ve)}:function(Ie,ke,me,ce){ce===void 0&&(ce=me),Ie[ce]=ke[me]}),L=ft&&ft.__setModuleDefault||(Object.create?function(Ie,ke){Object.defineProperty(Ie,"default",{enumerable:!0,value:ke})}:function(Ie,ke){Ie.default=ke}),F=ft&&ft.__importStar||function(Ie){if(Ie&&Ie.__esModule)return Ie;var ke={};if(Ie!=null)for(var me in Ie)me!=="default"&&Object.prototype.hasOwnProperty.call(Ie,me)&&A(ke,Ie,me);return L(ke,Ie),ke};Object.defineProperty(k,"__esModule",{value:!0}),k.MicVAD=k.getDefaultRealTimeVADOptions=k.ort=k.DEFAULT_MODEL=void 0;const K=F(Dh),X=Si,H=er,J=wr,C=ai,ge=ws,je=ka;k.DEFAULT_MODEL="legacy",k.ort=K;const ze="vad.worklet.bundle.min.js",Se="silero_vad_v5.onnx",ve="silero_vad_legacy.onnx",we=Ie=>({...H.defaultFrameProcessorOptions,onFrameProcessed:()=>{},onVADMisfire:()=>{J.log.debug("VAD misfire")},onSpeechStart:()=>{J.log.debug("Detected speech start")},onSpeechEnd:()=>{J.log.debug("Detected speech end")},onSpeechRealStart:()=>{J.log.debug("Detected real speech start")},baseAssetPath:"./",onnxWASMBasePath:"./",model:Ie,workletOptions:{},getStream:async()=>await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:!0,autoGainControl:!0,noiseSuppression:!0}}),pauseStream:async ke=>{ke.getTracks().forEach(me=>{me.stop()})},resumeStream:async()=>await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:!0,autoGainControl:!0,noiseSuppression:!0}}),ortConfig:ke=>{ke.env.logLevel="error"},startOnLoad:!0,processorType:"auto"});k.getDefaultRealTimeVADOptions=we;const Ne=Ie=>"audioWorklet"in Ie&&typeof AudioWorkletNode=="function"?"AudioWorklet":"ScriptProcessor";async function Ke(Ie,ke,me,ce,Ve){await me.audioWorklet.addModule(Ie),ke.processorOptions={...ke.processorOptions??{},frameSamples:ce};const re=new AudioWorkletNode(me,"vad-helper-worklet",ke);return re.port.onmessage=async ut=>{const He=ut.data;if(!(typeof He=="object"&&He&&"message"in He)){console.error("Invalid message event",He);return}switch(He.message){case C.Message.AudioFrame:{if(!("data"in He&&He.data instanceof ArrayBuffer)){console.log("Audio frame message has no data");return}const mt=new Float32Array(He.data);await Ve(mt);break}}},re}async function wt(Ie,ke,me){const ce=new je.Resampler({nativeSampleRate:Ie.sampleRate,targetSampleRate:16e3,targetFrameSize:ke});J.log.debug("using script processor");const re=Ie.createScriptProcessor(4096,1,1);let ut=!1;return re.onaudioprocess=async He=>{if(!ut){ut=!0;try{const mt=He.inputBuffer.getChannelData(0);He.outputBuffer.getChannelData(0).fill(0);const lt=ce.process(mt);for(const _t of lt)await me(_t)}catch(mt){console.error("Error processing audio:",mt)}finally{ut=!1}}},re.connect(Ie.destination),re}class Rt{constructor(ke,me,ce,Ve,re=!1,ut=null,He=null,mt=null,ur=null,lt=null,_t=null,_r="uninitialized",br=!1){this.options=ke,this.frameProcessor=me,this.model=ce,this.frameSamples=Ve,this.listening=re,this.errored=ut,this._stream=He,this._audioContext=mt,this._vadNode=ur,this._mediaStreamAudioSourceNode=lt,this._audioProcessorAdapterType=_t,this.initializationState=_r,this.ownsAudioContext=br,this.getAudioInstances=()=>{if(this._stream===null||this._audioContext===null||this._vadNode==null||this._mediaStreamAudioSourceNode==null)throw new Error("MicVAD has null stream, audio context, or processor adapter");return{stream:this._stream,audioContext:this._audioContext,vadNode:this._vadNode,mediaStreamAudioSourceNode:this._mediaStreamAudioSourceNode}},this.setErrored=Be=>{this.initializationState="errored",this.errored=Be},this.start=async()=>{switch(this.initializationState){case"uninitialized":{J.log.debug("initializing micVAD"),this.initializationState="initializing",this.frameProcessor.resume();try{this._stream=await this.options.getStream()}catch(Be){throw Be instanceof Error?this.setErrored(Be.message):this.setErrored(String(Be)),Be}if(this.options.audioContext?(console.log("using custom audio context"),this._audioContext=this.options.audioContext):(console.log("using default audio context"),this._audioContext=new AudioContext,this.ownsAudioContext=!0),!this._audioContext)throw this.setErrored("Audio context is null"),Error("Audio context is null");switch(this._audioProcessorAdapterType=this.options.processorType=="auto"?Ne(this._audioContext):this.options.processorType,this._audioProcessorAdapterType){case"AudioWorklet":this._vadNode=await Ke(this.options.baseAssetPath+ze,this.options.workletOptions,this._audioContext,this.frameSamples,this.processFrame);break;case"ScriptProcessor":this._vadNode=await wt(this._audioContext,this.frameSamples,this.processFrame);break;default:throw new Error(`Unsupported audio processor adapter type: ${this._audioProcessorAdapterType}`)}this._mediaStreamAudioSourceNode=new MediaStreamAudioSourceNode(this._audioContext,{mediaStream:this._stream}),this._mediaStreamAudioSourceNode.connect(this._vadNode),J.log.debug("started micVAD"),this.listening=!0,this.initializationState="initialized";break}case"initializing":{J.log.warn("start called while initializing");break}case"initialized":{if(this.listening)return;this.listening=!0,this.frameProcessor.resume();const{stream:Be,audioContext:Ct,vadNode:Ti}=this.getAudioInstances();this._stream=await this.options.resumeStream(Be);const rt=new MediaStreamAudioSourceNode(Ct,{mediaStream:this._stream});this._mediaStreamAudioSourceNode=rt,rt.connect(Ti);break}case"destroyed":{J.log.warn("start called after destroyed");break}case"errored":{J.log.error("start called after errored");break}default:{J.log.warn("weird initialization state");break}}},this.pause=async()=>{if(!this.listening)return;this.listening=!1;const{stream:Be,mediaStreamAudioSourceNode:Ct}=this.getAudioInstances();await this.options.pauseStream(Be),Ct.disconnect(),this.frameProcessor.pause(this.handleFrameProcessorEvent)},this.destroy=async()=>{var Ct;J.log.debug("destroy called"),this.initializationState="destroyed";const{vadNode:Be}=this.getAudioInstances();Be instanceof AudioWorkletNode&&Be.port.postMessage(C.Message.SpeechStop),this.listening&&await this.pause(),await this.model.release(),this.ownsAudioContext&&await((Ct=this._audioContext)==null?void 0:Ct.close())},this.setOptions=Be=>{this.frameProcessor.setOptions(Be)},this.processFrame=async Be=>{await this.frameProcessor.process(Be,this.handleFrameProcessorEvent)},this.handleFrameProcessorEvent=Be=>{switch(Be.msg){case C.Message.FrameProcessed:this.options.onFrameProcessed(Be.probs,Be.frame);break;case C.Message.SpeechStart:this.options.onSpeechStart();break;case C.Message.SpeechRealStart:this.options.onSpeechRealStart();break;case C.Message.VADMisfire:this.options.onVADMisfire();break;case C.Message.SpeechEnd:this.options.onSpeechEnd(Be.audio);break}}}static async new(ke={}){const me={...(0,k.getDefaultRealTimeVADOptions)(ke.model??k.DEFAULT_MODEL),...ke};(0,H.validateOptions)(me),k.ort.env.wasm.wasmPaths=me.onnxWASMBasePath,me.ortConfig!==void 0&&me.ortConfig(k.ort);const ce=me.model==="v5"?Se:ve,Ve=me.baseAssetPath+ce,re=me.model==="v5"?ge.SileroV5.new:ge.SileroLegacy.new;let ut;try{ut=await re(k.ort,()=>(0,X.defaultModelFetcher)(Ve))}catch(_t){throw console.error(`Encountered an error while loading model file ${Ve}`),_t}const He=me.model==="v5"?512:1536,mt=He/16,ur=new H.FrameProcessor(ut.process,ut.reset_state,{positiveSpeechThreshold:me.positiveSpeechThreshold,negativeSpeechThreshold:me.negativeSpeechThreshold,redemptionMs:me.redemptionMs,preSpeechPadMs:me.preSpeechPadMs,minSpeechMs:me.minSpeechMs,submitUserSpeechOnPause:me.submitUserSpeechOnPause},mt),lt=new Rt(me,ur,ut,He);if(me.startOnLoad)try{await lt.start()}catch(_t){throw console.error("Error starting micVad",_t),_t}return lt}}k.MicVAD=Rt})(_c);(function(k){Object.defineProperty(k,"__esModule",{value:!0}),k.getDefaultRealTimeVADOptions=k.MicVAD=k.DEFAULT_MODEL=k.utils=k.NonRealTimeVAD=k.Message=k.FrameProcessor=k.defaultModelFetcher=k.baseAssetPath=void 0;var A=Ia;Object.defineProperty(k,"baseAssetPath",{enumerable:!0,get:function(){return A.baseAssetPath}});var L=Si;Object.defineProperty(k,"defaultModelFetcher",{enumerable:!0,get:function(){return L.defaultModelFetcher}});var F=er;Object.defineProperty(k,"FrameProcessor",{enumerable:!0,get:function(){return F.FrameProcessor}});var K=ai;Object.defineProperty(k,"Message",{enumerable:!0,get:function(){return K.Message}});var X=pc;Object.defineProperty(k,"NonRealTimeVAD",{enumerable:!0,get:function(){return X.NonRealTimeVAD}});const H=Jt;k.utils={audioFileToArray:H.audioFileToArray,minFramesForTargetMS:H.minFramesForTargetMS,arrayBufferToBase64:H.arrayBufferToBase64,encodeWAV:H.encodeWAV};var J=_c;Object.defineProperty(k,"DEFAULT_MODEL",{enumerable:!0,get:function(){return J.DEFAULT_MODEL}}),Object.defineProperty(k,"MicVAD",{enumerable:!0,get:function(){return J.MicVAD}}),Object.defineProperty(k,"getDefaultRealTimeVADOptions",{enumerable:!0,get:function(){return J.getDefaultRealTimeVADOptions}})})(lc);const va={model:"v5",redemptionMs:1200,preSpeechPadMs:800,minSpeechMs:400,positiveSpeechThreshold:.3,negativeSpeechThreshold:.25,submitUserSpeechOnPause:!0,silenceAfterSpeechToStopMicMs:2500,silenceClosingMessageMs:1e4,silenceClosingPhrases:["Standing by if you need anything, sir.","I'll be here when you need me, sir.","At your service whenever you need me.","Ready when you are, sir.","I shall be here if you need me.","Standing by. Do call if you need anything.","Here whenever you need me, sir."],baseAssetPath:"https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.30/dist/",onnxWASMBasePath:"https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/"};function Ph(){var A;if(typeof window>"u")return!1;const k=new URL(window.location.href);return k.searchParams.get("debug")==="1"||k.searchParams.get("debug")==="true"?!0:!!(window.JARVIS_DEBUG||(A=window.JARVIS_CONFIG)!=null&&A.debug)}const Re={enabled:!1,prefix:"[JARVIS]",init(){this.enabled=Ph(),this.enabled&&this.log("Debug mode enabled")},log(...k){this.enabled&&typeof console<"u"&&console.log&&console.log(this.prefix,...k)},warn(...k){this.enabled&&typeof console<"u"&&console.warn&&console.warn(this.prefix,"[WARN]",...k)},error(...k){typeof console<"u"&&console.error&&console.error(this.prefix,"[ERROR]",...k)},trace(k,A){this.enabled&&this.log(`[TRACE] ${k}`,A!==void 0?A:"")}};Re.init();const oc="2025-04-16",Uh="",Nh="95131c95-525c-463b-893d-803bafdf93c4",Lh=100,Vh="wss://api.cartesia.ai/tts/websocket",uc="wss://api.cartesia.ai/stt/websocket";class Ea{constructor(A={}){this.options=A,this.apiKey=A.apiKey??Uh,this.voiceId=A.voiceId||Nh,this.language=A.language||"en",this.ttsModel=A.ttsModel||"sonic-turbo",this.audioContext=null,this.sttNode=null,this.ttsNode=null,this.mediaStream=null,this.sttWs=null,this.ttsWs=null,this.vad=null,this.contextIdCounter=0,this._ttsDoneResolvers=new Map,this._ttsConnectPromise=null,this._sttStreaming=!1,this._preSpeechBuffer=[],this._preSpeechMaxChunks=Math.ceil(va.preSpeechPadMs/Lh),this.onTranscript=A.onTranscript||(()=>{}),this.onTTSChunk=A.onTTSChunk||(()=>{}),this.onError=A.onError||(()=>{}),this.onSpeechStart=A.onSpeechStart||(()=>{}),this.onSpeechEnd=A.onSpeechEnd||(()=>{}),this.onVADMisfire=A.onVADMisfire||(()=>{}),this.onSTTStopped=A.onSTTStopped||(()=>{}),this.onPartialTranscript=A.onPartialTranscript||(()=>{}),this.onSilenceClosingMessage=A.onSilenceClosingMessage||(()=>{}),this._sttActive=!1,this._silenceStopTimer=null,this._silenceClosingTimer=null}isSTTActive(){return this._sttActive===!0}startAgentSilenceTimer(){const A=va.silenceClosingMessageMs,L=va.silenceClosingPhrases;!Array.isArray(L)||L.length===0||(this._clearSilenceClosingTimer(),this._silenceClosingTimer=setTimeout(()=>{this._silenceClosingTimer=null;const F=L.filter(X=>typeof X=="string"&&X.trim().length>0),K=F.length>0?F[Math.floor(Math.random()*F.length)].trim():"";Re.trace("10s after agent spoke: firing onSilenceClosingMessage",{phrase:K});try{K&&this.onSilenceClosingMessage(K)}finally{this.stopSTT()}},A))}static checkRecordingSupport(){return typeof navigator>"u"?{supported:!1,message:"Not in a browser environment."}:typeof window>"u"||!window.isSecureContext?{supported:!1,message:"Microphone requires HTTPS or localhost. Open this page over HTTPS or run locally."}:!navigator.mediaDevices||typeof navigator.mediaDevices.getUserMedia!="function"?{supported:!1,message:"This browser does not support microphone access. Try Chrome, Firefox, or Edge."}:{supported:!0}}static getMicrophoneErrorMessage(A){if(!A)return"Microphone error.";const L=A.name||"",F=A.message||"";switch(L){case"NotAllowedError":case"PermissionDeniedError":return"Microphone access was denied. Please allow microphone permission and try again.";case"NotFoundError":return"No microphone found. Connect a microphone and try again.";case"NotSupportedError":case"SecurityError":return"Microphone is not available. Use HTTPS or localhost.";case"AbortError":return"Microphone access was aborted.";case"NotReadableError":return"Microphone is in use by another app. Close other apps using the mic and try again.";case"OverconstrainedError":return"Microphone does not meet requirements. Try a different device or browser.";default:return F||"Microphone error. Please check permissions and try again."}}async init(){if(this.audioContext)return;this.audioContext=new AudioContext,this.audioContext.state==="suspended"&&await this.audioContext.resume();const A=this.options.audioWorkletBasePath||"./audio/";return await this.audioContext.audioWorklet.addModule(`${A}stt-capture-processor.js`),await this.audioContext.audioWorklet.addModule(`${A}tts-playback-processor.js`),this.ttsNode=new AudioWorkletNode(this.audioContext,"tts-playback-processor"),this.ttsNode.connect(this.audioContext.destination),this.audioContext}async connectSTTWebSocket(){const A=new URL(uc);return A.searchParams.set("api_key",this.apiKey),A.searchParams.set("cartesia_version",oc),Re.trace("STT WebSocket connecting",{url:uc}),this.sttWs=new WebSocket(A.toString()),new Promise((L,F)=>{this.sttWs.onopen=()=>{Re.trace("STT WebSocket open");const K={model:"ink-whisper",language:this.language,encoding:"pcm_s16le",sample_rate:"16000",min_volume:"0.0",max_silence_duration_secs:"2.0"};this.sttWs.send(JSON.stringify(K)),L()},this.sttWs.onmessage=K=>{var X;if(typeof K.data=="string")try{const H=JSON.parse(K.data);H.type==="transcript"?(Re.trace("STT transcript",{text:(X=H.text)==null?void 0:X.slice(0,50),is_final:H.is_final}),this.onPartialTranscript(H.text,H.is_final),this.onTranscript(H.text,H.is_final,H.request_id||"")):H.type==="error"||H.error?Re.error("STT server error",H.error||H):Re.enabled&&Re.trace("STT message",{type:H.type})}catch{}},this.sttWs.onerror=()=>{Re.error("STT WebSocket error"),F(new Error("STT WebSocket error"))},this.sttWs.onclose=K=>{Re.trace("STT WebSocket closed",{code:K.code,reason:K.reason})}})}_sendChunkToSTT(A){!this.sttWs||this.sttWs.readyState!==WebSocket.OPEN||!this._sttStreaming||this.sttWs.send(A)}_flushPreSpeechBuffer(){for(const A of this._preSpeechBuffer)this._sendChunkToSTT(A);this._preSpeechBuffer=[]}async startSTT(){if(this._sttActive)return;if(!this.apiKey)throw new Error("CARTESIA_API_KEY is required.");const A=Ea.checkRecordingSupport();if(!A.supported)throw new Error(A.message);Re.trace("startSTT: recording support OK");try{await this.init(),Re.trace("startSTT: init OK"),await this.connectSTTWebSocket(),Re.trace("startSTT: STT WebSocket connected");let L;try{L=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:!0,noiseSuppression:!0}})}catch(H){throw Re.error("getUserMedia failed",H),new Error(Ea.getMicrophoneErrorMessage(H))}this.mediaStream=L,Re.trace("startSTT: getUserMedia OK, stream tracks:",L.getTracks().length);const F=this.audioContext.createMediaStreamSource(L);this.sttNode=new AudioWorkletNode(this.audioContext,"stt-capture-processor"),F.connect(this.sttNode),this._preSpeechBuffer=[],this._sttStreaming=!1;let K=0;this.sttNode.port.onmessage=H=>{if(H.data.type!=="audio"||!H.data.data)return;K++,Re.enabled&&K<=3&&Re.trace("stt-capture: audio chunk received",{chunk:K,streaming:this._sttStreaming});const J=H.data.data;this._sttStreaming?this._sendChunkToSTT(J):(this._preSpeechBuffer.push(J),this._preSpeechBuffer.length>this._preSpeechMaxChunks&&this._preSpeechBuffer.shift())};const X={...va,getStream:()=>Promise.resolve(L),onSpeechStart:()=>{Re.trace("VAD onSpeechStart - enabling STT streaming"),this._clearSilenceStopTimer(),this._clearSilenceClosingTimer(),this.onSpeechStart(),this._bargeIn(),this._sttStreaming=!0,this._flushPreSpeechBuffer()},onSpeechEnd:()=>{var J;Re.trace("VAD onSpeechEnd - sending finalize, starting 2.5s mic stop timer"),this.onSpeechEnd(),this._sttStreaming=!1,((J=this.sttWs)==null?void 0:J.readyState)===WebSocket.OPEN&&this.sttWs.send("finalize");const H=va.silenceAfterSpeechToStopMicMs??2500;this._clearSilenceStopTimer(),H>0&&(this._silenceStopTimer=setTimeout(()=>{this._silenceStopTimer=null,this.stopSTT()},H))},onVADMisfire:()=>this.onVADMisfire()};this.vad=await lc.MicVAD.new(X),this.vad.start(),this._sttActive=!0,Re.trace("startSTT: VAD started, pipeline active")}catch(L){throw Re.error("startSTT failed",L),this.stopSTT(),L}}_clearSilenceStopTimer(){this._silenceStopTimer&&(clearTimeout(this._silenceStopTimer),this._silenceStopTimer=null)}_clearSilenceClosingTimer(){this._silenceClosingTimer&&(clearTimeout(this._silenceClosingTimer),this._silenceClosingTimer=null)}_bargeIn(){this.clearTTSBuffer(),[...this._ttsDoneResolvers.keys()].forEach(L=>{this.cancelTTS(L);const F=this._ttsDoneResolvers.get(L);F&&F.reject(new Error("Barge-in: user spoke")),this._ttsDoneResolvers.delete(L)})}stopSTT(){this._clearSilenceStopTimer(),this._clearSilenceClosingTimer();const A=this._sttActive;if(this._sttActive=!1,this.vad&&(this.vad.pause(),this.vad=null),this._sttStreaming=!1,this._preSpeechBuffer=[],this.mediaStream&&(this.mediaStream.getTracks().forEach(L=>L.stop()),this.mediaStream=null),this.sttNode&&(this.sttNode.disconnect(),this.sttNode=null),this.sttWs){if(this.sttWs.readyState===WebSocket.OPEN)try{this.sttWs.send("done")}catch{}this.sttWs.close(),this.sttWs=null}A&&this.onSTTStopped()}async connectTTS(){var L;if(!this.apiKey)throw new Error("CARTESIA_API_KEY is required.");if(await this.init(),((L=this.ttsWs)==null?void 0:L.readyState)===WebSocket.OPEN)return;if(this._ttsConnectPromise)return this._ttsConnectPromise;const A=new URL(Vh);return A.searchParams.set("api_key",this.apiKey),A.searchParams.set("cartesia_version",oc),this.ttsWs=new WebSocket(A.toString()),this._ttsConnectPromise=new Promise((F,K)=>{this.ttsWs.onopen=()=>{this._ttsConnectPromise=null,F()},this.ttsWs.onerror=()=>{this._ttsConnectPromise=null,K(new Error("TTS WebSocket error"))},this.ttsWs.onclose=()=>{this._ttsConnectPromise=null},this.ttsWs.onmessage=X=>{if(typeof X.data=="string")try{const H=JSON.parse(X.data);if(H.type==="chunk"&&H.data){const J=$h(H.data);this.playTTSChunk(J),this.onTTSChunk(H)}else if(H.type==="done"&&H.context_id){const J=this._ttsDoneResolvers.get(H.context_id);J&&(this._ttsDoneResolvers.delete(H.context_id),J.resolve())}else if((H.type==="error"||H.error)&&H.context_id){const J=this._ttsDoneResolvers.get(H.context_id);J&&(this._ttsDoneResolvers.delete(H.context_id),J.reject(new Error(H.error||"TTS error"))),this.onError(H.error||"TTS error")}}catch(H){this.onError(H)}}}),this._ttsConnectPromise}playTTSChunk(A){this.ttsNode&&this.ttsNode.port.postMessage({type:"audio",samples:Array.from(A)})}clearTTSBuffer(){this.ttsNode&&this.ttsNode.port.postMessage({type:"clear"})}async speakText(A,L=null,F=!1){await this.connectTTS();const K=L||`ctx_${++this.contextIdCounter}_${Date.now()}`;return this.ttsWs.send(JSON.stringify({model_id:this.ttsModel,transcript:A,voice:{mode:"id",id:this.voiceId},language:this.language,context_id:K,output_format:{container:"raw",encoding:"pcm_s16le",sample_rate:44100},add_timestamps:!0,continue:F,max_buffer_delay_ms:0})),F?Promise.resolve():new Promise((X,H)=>{this._ttsDoneResolvers.set(K,{resolve:X,reject:H})})}async streamTextChunks(A,L=null){const F=L||`ctx_${++this.contextIdCounter}_${Date.now()}`;for(let K=0;K<A.length;K++)await this.speakText(A[K],F,K<A.length-1);return F}cancelTTS(A){var L;((L=this.ttsWs)==null?void 0:L.readyState)===WebSocket.OPEN&&this.ttsWs.send(JSON.stringify({context_id:A,cancel:!0})),this.clearTTSBuffer()}disconnectTTS(){this._ttsDoneResolvers.forEach(({reject:A})=>A(new Error("TTS disconnected"))),this._ttsDoneResolvers.clear(),this._ttsConnectPromise=null,this.ttsWs&&(this.ttsWs.close(),this.ttsWs=null)}destroy(){this.stopSTT(),this.disconnectTTS(),this.ttsNode&&(this.ttsNode.disconnect(),this.ttsNode=null),this.audioContext&&(this.audioContext.close(),this.audioContext=null)}}function Wh(){let k="UTC",A="",L="";try{typeof Intl<"u"&&Intl.DateTimeFormat&&(k=Intl.DateTimeFormat().resolvedOptions().timeZone||k),typeof navigator<"u"&&(A=navigator.language||navigator.userLanguage||"",L=navigator.languages&&navigator.languages[0]||A||"")}catch{}return{timezone:k,locale:A,language:L}}function Fh(k,A={}){const L=A.source??"text",F=A.sessionId??`sess_${Date.now()}_${Math.random().toString(36).slice(2,11)}`,X=(A.attachments??[]).map(ze=>ze instanceof File?{name:ze.name,type:ze.type,size:ze.size}:ze&&typeof ze=="object"&&"name"in ze?{name:ze.name,type:ze.type??"",size:ze.size??0}:null).filter(Boolean),H=new Date().toISOString(),J=`msg_${Date.now()}_${Math.random().toString(36).slice(2,11)}`,{timezone:C,locale:ge,language:je}=Wh();return{message:(k||"").trim(),session_id:F,sessionId:F,timestamp:H,timezone:C,location:C,message_id:J,messageId:J,source:L,attachments:X,locale:ge||void 0,language:je||void 0}}const qh={VITE_CARTESIA_API_KEY:"sk_car_GYAnGSmHkAFGYbr52wL9HG",VITE_CARTESIA_VOICE_ID:"95131c95-525c-463b-893d-803bafdf93c4",VITE_N8N_WEBHOOK_URL:"https://n8n.hempstarai.com/webhook/e7278dba-076f-4fe9-8c8f-0241e4103ac4"},xa=document.getElementById("chatContainer"),Sa=document.getElementById("textInput"),$c=document.getElementById("btnSend"),or=document.getElementById("btnMic"),Gh=document.getElementById("btnPaperclip"),Za=document.getElementById("fileInput"),Ta=document.getElementById("status");if(!xa||!Ta)throw typeof console<"u"&&console.error&&console.error("[JARVIS] Missing required DOM (chatContainer or status). Load app.js on the correct page."),new Error("JARVIS: missing required DOM elements");function Hh(){const k=typeof import.meta<"u"?qh:{},L=(typeof window<"u"?window:{}).JARVIS_CONFIG||{};return{apiKey:k.VITE_CARTESIA_API_KEY||L.apiKey||"",voiceId:k.VITE_CARTESIA_VOICE_ID||L.voiceId||"",n8nWebhookUrl:k.VITE_N8N_WEBHOOK_URL||L.n8nWebhookUrl||"https://n8n.hempstarai.com/webhook/e7278dba-076f-4fe9-8c8f-0241e4103ac4"}}const{apiKey:vs,voiceId:jh,n8nWebhookUrl:Kh}=Hh(),Zh=`sess_${Date.now()}_${Math.random().toString(36).slice(2,11)}`;function Qh(k,A){return Fh(k,{...A,sessionId:Zh})}function We(k,A=""){Ta&&(Ta.textContent=k,Ta.className="status "+A)}function Qa(k=!1,A=!1){or&&(Re.trace("syncMicButton",{recording:k,disabled:A}),or.disabled=A,k?(or.classList.add("active","recording"),or.setAttribute("aria-pressed","true"),or.setAttribute("aria-label","Microphone on — click to stop")):(or.classList.remove("active","recording"),or.setAttribute("aria-pressed","false"),or.setAttribute("aria-label","Microphone — click to talk")))}function ii(k,A,L=[]){if(!xa)return null;const F=document.createElement("div");F.className="message "+k;const K=k==="user"?"You":"JARVIS";let X="";return L.length&&(X='<div class="attachments">'+L.map(H=>{if(H&&typeof H=="object"&&H.type&&H.type.startsWith("image/"))return`<img src="${H.url||URL.createObjectURL(H)}" alt="Attachment" />`;const C=typeof H=="string"?H:H&&H.name||"File";return`<span class="file-name">${gs(C)}</span>`}).join("")+"</div>"),F.innerHTML=`<div class="label">${gs(K)}</div><div class="content">${gs(A)}</div>${X}`,xa.appendChild(F),xa.scrollTop=xa.scrollHeight,F}function gs(k){const A=document.createElement("div");return A.textContent=k,A.innerHTML}const Xh=["output","reply","result","text","message","response","answer","content"];function ys(k){if(!k||typeof k!="object")return null;for(const A of Xh){const L=k[A];if(typeof L=="string")return L}if(Array.isArray(k)&&k.length){const A=k[0];if(typeof A=="string")return A;if(A&&typeof A=="object")return ys(A)}for(const A of Object.values(k)){if(typeof A=="string")return A;if(A&&typeof A=="object"&&!Array.isArray(A)){const L=ys(A);if(L)return L}}return null}function Yh(k){const A=(k||"").trim().toLowerCase().replace(/[!?.,]+$/,"");return A?["hello","hi","hey","hi there","hello there","good morning","good afternoon","good evening","greetings","howdy"].some(F=>A===F||A.startsWith(F+" "))?"Hello! How can I assist you today?":A==="goodbye"||A==="bye"||A==="see you"?"Goodbye. I'll be here when you need me.":A==="thanks"||A==="thank you"||A==="thanks!"?"You're welcome.":A==="yes"||A==="no"?"Understood.":null:null}async function xc(k,A={}){const L=Qh(k,A);if(!L.message)return"I didn't catch that. Try again?";Re.trace("n8n: sending payload",{message:L.message.slice(0,50),source:L.source});try{const F=await fetch(Kh,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(L)}),K=await F.json().catch(()=>({})),X=ys(K);if(Re.trace("n8n: response",{status:F.status,hasReply:!!X,replyPreview:typeof X=="string"?X.slice(0,50):""}),typeof X=="string")return X;const H=Yh(L.message),J=H||"I heard you. I'm still getting set up — please try again in a moment.";return Re.trace("n8n: using fallback (no reply in response)",{natural:!!H,fallbackPreview:J.slice(0,50)}),H||J}catch(F){return Re.error("n8n webhook error",F),"Sorry, I couldn't reach the assistant. Please try again."}}const Ot=new Ea({apiKey:vs||void 0,voiceId:jh||void 0,ttsModel:"sonic-turbo",audioWorkletBasePath:new URL("audio/",document.baseURI).href,onPartialTranscript:(k,A)=>{!A&&k.trim()&&We(`Listening… "${k.slice(0,40)}${k.length>40?"…":""}"`,"listening")},onTranscript:async(k,A)=>{if(!A)return;if(!k.trim()){Re.trace("onTranscript: empty text, skipping n8n");return}Re.trace("onTranscript: final text received, sending to n8n",{text:k.slice(0,80)}),ii("user",k),We("Processing…","listening");const L=await xc(k,{source:"voice"});ii("assistant",L),We("Speaking…","speaking"),Ot.speakText(L).then(()=>{We("Ready"),Ot.startAgentSilenceTimer()}).catch(F=>{We("Error","error"),ii("assistant","Sorry, I could not speak that. "+((F==null?void 0:F.message)||F))})},onTTSChunk:()=>{},onError:k=>{console.error("[JARVIS]",k),We("Error","error"),Ot.isSTTActive()&&Ot.stopSTT()},onSTTStopped:()=>{Re.trace("onSTTStopped: mic reverting to idle (syncMicButton false)"),Qa(!1,!1),We("Ready")},onSpeechStart:()=>We("Listening…","listening"),onSpeechEnd:()=>We("Processing…","listening"),onVADMisfire:()=>{Re.trace("VAD misfire - speech too short"),We("Try again — speak a bit longer","status-misfire"),setTimeout(()=>{Ta.textContent.includes("Try again")&&We("Listening…","listening")},2500)},onSilenceClosingMessage:k=>{if(Re.trace("onSilenceClosingMessage received",{phrase:k}),!k||typeof k!="string"||!k.trim()){We("Ready");return}const A=k.trim();We("Standing by…",""),ii("assistant",A),Ot.speakText(A).then(()=>We("Ready")).catch(()=>We("Ready"))}});let Xa=[];$c.addEventListener("click",async()=>{const k=Sa.value.trim();if(!k)return;if(!vs){We("Add CARTESIA_API_KEY (or set window.JARVIS_CONFIG.apiKey)","error");return}Sa.value="",Sa.placeholder="Type or speak...";const A=[...Xa];ii("user",k,A.length?A:[]),Xa=[],We("Processing…","listening");const L=await xc(k,{source:"text",attachments:A});ii("assistant",L),We("Speaking…","speaking");try{await Ot.speakText(L),We("Ready")}catch(F){We("Error","error"),ii("assistant","Sorry, something went wrong. "+((F==null?void 0:F.message)||F))}});Sa.addEventListener("keydown",k=>{k.key==="Enter"&&!k.shiftKey&&(k.preventDefault(),$c.click())});or.addEventListener("click",async()=>{if(Re.trace("Mic clicked",{sttActive:Ot.isSTTActive()}),Ot.isSTTActive()){Ot.stopSTT();return}if(!vs){We("Add CARTESIA_API_KEY (or set window.JARVIS_CONFIG.apiKey)","error");return}const k=Ea.checkRecordingSupport();if(!k.supported){We(k.message||"Microphone not available","error");return}Qa(!1,!0);try{We("Connecting…"),await Ot.connectTTS().catch(()=>{}),Re.trace("TTS connected, starting STT…"),await Ot.startSTT(),Qa(!0,!1),We("Listening…","listening")}catch(A){const L=(A==null?void 0:A.message)||String(A);We(L.startsWith("Mic ")?L:"Mic: "+L,"error"),Qa(!1,!1)}});Gh.addEventListener("click",()=>Za.click());Za.addEventListener("change",()=>{const k=Array.from(Za.files||[]);if(!k.length)return;Xa.push(...k);const A=Xa.length;Sa.placeholder=A?`${A} file(s) attached — type a message...`:"Type or speak...",Za.value=""});window.addEventListener("beforeunload",()=>Ot.destroy());
