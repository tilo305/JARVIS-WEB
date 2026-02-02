(function(){const B=document.createElement("link").relList;if(B&&B.supports&&B.supports("modulepreload"))return;for(const K of document.querySelectorAll('link[rel="modulepreload"]'))j(K);new MutationObserver(K=>{for(const Y of K)if(Y.type==="childList")for(const Q of Y.addedNodes)Q.tagName==="LINK"&&Q.rel==="modulepreload"&&j(Q)}).observe(document,{childList:!0,subtree:!0});function G(K){const Y={};return K.integrity&&(Y.integrity=K.integrity),K.referrerPolicy&&(Y.referrerPolicy=K.referrerPolicy),K.crossOrigin==="use-credentials"?Y.credentials="include":K.crossOrigin==="anonymous"?Y.credentials="omit":Y.credentials="same-origin",Y}function j(K){if(K.ep)return;K.ep=!0;const Y=G(K);fetch(K.href,Y)}})();function wh(R){const B=atob(R),G=new Uint8Array(B.length);for(let j=0;j<B.length;j++)G[j]=B.charCodeAt(j);return new Int16Array(G.buffer,G.byteOffset,G.byteLength>>1)}var ht=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{},nc={},xa={};Object.defineProperty(xa,"__esModule",{value:!0});xa.baseAssetPath=void 0;const _h=typeof window<"u"&&typeof window.document<"u",Yp=_h?window.document.currentScript:null;let sc="/";Yp&&(sc=Yp.src.replace(/#.*$/,"").replace(/\?.*$/,"").replace(/\/[^/]+$/,"/"));xa.baseAssetPath=sc;var xi={};Object.defineProperty(xi,"__esModule",{value:!0});xi.defaultModelFetcher=void 0;const bh=R=>fetch(R).then(B=>B.arrayBuffer());xi.defaultModelFetcher=bh;var Yt={},yr={};Object.defineProperty(yr,"__esModule",{value:!0});yr.log=void 0;const ps=R=>B=>{console.log(`VAD | ${R} >`,B)};yr.log={error:ps("error"),debug:ps("debug"),warn:ps("warn")};var ri={};Object.defineProperty(ri,"__esModule",{value:!0});ri.Message=void 0;var Jp;(function(R){R.AudioFrame="AUDIO_FRAME",R.SpeechStart="SPEECH_START",R.VADMisfire="VAD_MISFIRE",R.SpeechEnd="SPEECH_END",R.SpeechStop="SPEECH_STOP",R.SpeechRealStart="SPEECH_REAL_START",R.FrameProcessed="FRAME_PROCESSED"})(Jp||(ri.Message=Jp={}));Object.defineProperty(Yt,"__esModule",{value:!0});Yt.FrameProcessor=Yt.validateOptions=Yt.defaultFrameProcessorOptions=void 0;const _a=yr,ti=ri;Yt.defaultFrameProcessorOptions={positiveSpeechThreshold:.3,negativeSpeechThreshold:.25,preSpeechPadMs:800,redemptionMs:1400,minSpeechMs:400,submitUserSpeechOnPause:!1};function $h(R){(R.positiveSpeechThreshold<0||R.positiveSpeechThreshold>1)&&_a.log.error("positiveSpeechThreshold should be a number between 0 and 1"),(R.negativeSpeechThreshold<0||R.negativeSpeechThreshold>R.positiveSpeechThreshold)&&_a.log.error("negativeSpeechThreshold should be between 0 and positiveSpeechThreshold"),R.preSpeechPadMs<0&&_a.log.error("preSpeechPadMs should be positive"),R.redemptionMs<0&&_a.log.error("redemptionMs should be positive"),R.minSpeechMs<0&&_a.log.error("minSpeechMs should be positive")}Yt.validateOptions=$h;const ec=R=>{const B=R.reduce((j,K)=>(j.push(j.at(-1)+K.length),j),[0]),G=new Float32Array(B.at(-1));return R.forEach((j,K)=>{const Y=B[K];G.set(j,Y)}),G};function tc(R,B){const G=Math.floor(R.redemptionMs/B),j=Math.floor(R.preSpeechPadMs/B),K=Math.floor(R.minSpeechMs/B);return{redemptionFrames:G,preSpeechPadFrames:j,minSpeechFrames:K}}class vh{constructor(B,G,j,K){this.modelProcessFunc=B,this.modelResetFunc=G,this.options=j,this.msPerFrame=K,this.speaking=!1,this.redemptionCounter=0,this.speechFrameCount=0,this.active=!1,this.speechRealStartFired=!1,this.setOptions=I=>{this.options={...this.options,...I};const{redemptionFrames:ye,preSpeechPadFrames:Ye,minSpeechFrames:Le}=tc(this.options,this.msPerFrame);this.redemptionFrames=ye,this.preSpeechPadFrames=Ye,this.minSpeechFrames=Le},this.reset=()=>{this.speaking=!1,this.speechRealStartFired=!1,this.audioBuffer=[],this.modelResetFunc(),this.redemptionCounter=0,this.speechFrameCount=0},this.pause=I=>{this.active=!1,this.options.submitUserSpeechOnPause?this.endSegment(I):this.reset()},this.resume=()=>{this.active=!0},this.endSegment=I=>{const ye=this.audioBuffer;this.audioBuffer=[];const Ye=this.speaking;if(this.reset(),Ye)if(ye.reduce((Se,$e)=>$e.isSpeech?Se+1:Se,0)>=this.minSpeechFrames){const Se=ec(ye.map($e=>$e.frame));I({msg:ti.Message.SpeechEnd,audio:Se})}else I({msg:ti.Message.VADMisfire});return{}},this.process=async(I,ye)=>{if(!this.active)return;const Ye=await this.modelProcessFunc(I),Le=Ye.isSpeech>=this.options.positiveSpeechThreshold;if(ye({probs:Ye,msg:ti.Message.FrameProcessed,frame:I}),this.audioBuffer.push({frame:I,isSpeech:Le}),Le&&(this.speechFrameCount++,this.redemptionCounter=0),Le&&!this.speaking&&(this.speaking=!0,ye({msg:ti.Message.SpeechStart})),this.speaking&&this.speechFrameCount===this.minSpeechFrames&&!this.speechRealStartFired&&(this.speechRealStartFired=!0,ye({msg:ti.Message.SpeechRealStart})),Ye.isSpeech<this.options.negativeSpeechThreshold&&this.speaking&&++this.redemptionCounter>=this.redemptionFrames){this.redemptionCounter=0,this.speechFrameCount=0,this.speaking=!1,this.speechRealStartFired=!1;const Se=this.audioBuffer;if(this.audioBuffer=[],Se.reduce((we,Pe)=>Pe.isSpeech?we+1:we,0)>=this.minSpeechFrames){const we=ec(Se.map(Pe=>Pe.frame));ye({msg:ti.Message.SpeechEnd,audio:we})}else ye({msg:ti.Message.VADMisfire})}if(!this.speaking){for(;this.audioBuffer.length>this.preSpeechPadFrames;)this.audioBuffer.shift();this.speechFrameCount=0}},this.audioBuffer=[];const{redemptionFrames:Y,preSpeechPadFrames:Q,minSpeechFrames:oe}=tc(this.options,this.msPerFrame);this.redemptionFrames=Y,this.preSpeechPadFrames=Q,this.minSpeechFrames=oe,this.reset()}}Yt.FrameProcessor=vh;var oc={};function zt(R){throw new Error('Could not dynamically require "'+R+'". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.')}var uc={exports:{}};/*!
 * ONNX Runtime Web v1.23.2
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */(function(R,B){var G=(()=>{var j=Object.defineProperty,K=Object.getOwnPropertyDescriptor,Y=Object.getOwnPropertyNames,Q=Object.prototype.hasOwnProperty,oe=(e=>typeof zt<"u"?zt:typeof Proxy<"u"?new Proxy(e,{get:(t,r)=>(typeof zt<"u"?zt:t)[r]}):e)(function(e){if(typeof zt<"u")return zt.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')}),I=(e,t)=>()=>(e&&(t=e(e=0)),t),ye=(e,t)=>{for(var r in t)j(e,r,{get:t[r],enumerable:!0})},Ye=(e,t,r,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let a of Y(t))!Q.call(e,a)&&a!==r&&j(e,a,{get:()=>t[a],enumerable:!(i=K(t,a))||i.enumerable});return e},Le=e=>Ye(j({},"__esModule",{value:!0}),e),Se,$e,we,Pe,Ge,yt=I(()=>{Se=new Map,$e=[],we=(e,t,r)=>{if(t&&typeof t.init=="function"&&typeof t.createInferenceSessionHandler=="function"){let i=Se.get(e);if(i===void 0)Se.set(e,{backend:t,priority:r});else{if(i.priority>r)return;if(i.priority===r&&i.backend!==t)throw new Error(`cannot register backend "${e}" using priority ${r}`)}if(r>=0){let a=$e.indexOf(e);a!==-1&&$e.splice(a,1);for(let n=0;n<$e.length;n++)if(Se.get($e[n]).priority<=r){$e.splice(n,0,e);return}$e.push(e)}return}throw new TypeError("not a valid backend")},Pe=async e=>{let t=Se.get(e);if(!t)return"backend not found.";if(t.initialized)return t.backend;if(t.aborted)return t.error;{let r=!!t.initPromise;try{return r||(t.initPromise=t.backend.init(e)),await t.initPromise,t.initialized=!0,t.backend}catch(i){return r||(t.error=`${i}`,t.aborted=!0),t.error}finally{delete t.initPromise}}},Ge=async e=>{let t=e.executionProviders||[],r=t.map(u=>typeof u=="string"?u:u.name),i=r.length===0?$e:r,a,n=[],s=new Set;for(let u of i){let l=await Pe(u);typeof l=="string"?n.push({name:u,err:l}):(a||(a=l),a===l&&s.add(u))}if(!a)throw new Error(`no available backend found. ERR: ${n.map(u=>`[${u.name}] ${u.err}`).join(", ")}`);for(let{name:u,err:l}of n)r.includes(u)&&console.warn(`removing requested execution provider "${u}" from session options because it is not available: ${l}`);let o=t.filter(u=>s.has(typeof u=="string"?u:u.name));return[a,new Proxy(e,{get:(u,l)=>l==="executionProviders"?o:Reflect.get(u,l)})]}}),At=I(()=>{yt()}),ke,Ie=I(()=>{ke="1.23.2"}),me,ce,Ne=I(()=>{Ie(),me="warning",ce={wasm:{},webgl:{},webgpu:{},versions:{common:ke},set logLevel(e){if(e!==void 0){if(typeof e!="string"||["verbose","info","warning","error","fatal"].indexOf(e)===-1)throw new Error(`Unsupported logging level: ${e}`);me=e}},get logLevel(){return me}},Object.defineProperty(ce,"logLevel",{enumerable:!0})}),te,ot=I(()=>{Ne(),te=ce}),qe,ft,nr=I(()=>{qe=(e,t)=>{let r=typeof document<"u"?document.createElement("canvas"):new OffscreenCanvas(1,1);r.width=e.dims[3],r.height=e.dims[2];let i=r.getContext("2d");if(i!=null){let a,n;(t==null?void 0:t.tensorLayout)!==void 0&&t.tensorLayout==="NHWC"?(a=e.dims[2],n=e.dims[3]):(a=e.dims[3],n=e.dims[2]);let s=(t==null?void 0:t.format)!==void 0?t.format:"RGB",o=t==null?void 0:t.norm,u,l;o===void 0||o.mean===void 0?u=[255,255,255,255]:typeof o.mean=="number"?u=[o.mean,o.mean,o.mean,o.mean]:(u=[o.mean[0],o.mean[1],o.mean[2],0],o.mean[3]!==void 0&&(u[3]=o.mean[3])),o===void 0||o.bias===void 0?l=[0,0,0,0]:typeof o.bias=="number"?l=[o.bias,o.bias,o.bias,o.bias]:(l=[o.bias[0],o.bias[1],o.bias[2],0],o.bias[3]!==void 0&&(l[3]=o.bias[3]));let d=n*a,p=0,h=d,f=d*2,m=-1;s==="RGBA"?(p=0,h=d,f=d*2,m=d*3):s==="RGB"?(p=0,h=d,f=d*2):s==="RBG"&&(p=0,f=d,h=d*2);for(let y=0;y<n;y++)for(let $=0;$<a;$++){let _=(e.data[p++]-l[0])*u[0],w=(e.data[h++]-l[1])*u[1],S=(e.data[f++]-l[2])*u[2],x=m===-1?255:(e.data[m++]-l[3])*u[3];i.fillStyle="rgba("+_+","+w+","+S+","+x+")",i.fillRect($,y,1,1)}if("toDataURL"in r)return r.toDataURL();throw new Error("toDataURL is not supported")}else throw new Error("Can not access image data")},ft=(e,t)=>{let r=typeof document<"u"?document.createElement("canvas").getContext("2d"):new OffscreenCanvas(1,1).getContext("2d"),i;if(r!=null){let a,n,s;(t==null?void 0:t.tensorLayout)!==void 0&&t.tensorLayout==="NHWC"?(a=e.dims[2],n=e.dims[1],s=e.dims[3]):(a=e.dims[3],n=e.dims[2],s=e.dims[1]);let o=t!==void 0&&t.format!==void 0?t.format:"RGB",u=t==null?void 0:t.norm,l,d;u===void 0||u.mean===void 0?l=[255,255,255,255]:typeof u.mean=="number"?l=[u.mean,u.mean,u.mean,u.mean]:(l=[u.mean[0],u.mean[1],u.mean[2],255],u.mean[3]!==void 0&&(l[3]=u.mean[3])),u===void 0||u.bias===void 0?d=[0,0,0,0]:typeof u.bias=="number"?d=[u.bias,u.bias,u.bias,u.bias]:(d=[u.bias[0],u.bias[1],u.bias[2],0],u.bias[3]!==void 0&&(d[3]=u.bias[3]));let p=n*a;if(t!==void 0&&(t.format!==void 0&&s===4&&t.format!=="RGBA"||s===3&&t.format!=="RGB"&&t.format!=="BGR"))throw new Error("Tensor format doesn't match input tensor dims");let h=4,f=0,m=1,y=2,$=3,_=0,w=p,S=p*2,x=-1;o==="RGBA"?(_=0,w=p,S=p*2,x=p*3):o==="RGB"?(_=0,w=p,S=p*2):o==="RBG"&&(_=0,S=p,w=p*2),i=r.createImageData(a,n);for(let C=0;C<n*a;f+=h,m+=h,y+=h,$+=h,C++)i.data[f]=(e.data[_++]-d[0])*l[0],i.data[m]=(e.data[w++]-d[1])*l[1],i.data[y]=(e.data[S++]-d[2])*l[2],i.data[$]=x===-1?255:(e.data[x++]-d[3])*l[3]}else throw new Error("Can not access image data");return i}}),ut,wt,wr,_r,Oe,It,Si=I(()=>{$r(),ut=(e,t)=>{if(e===void 0)throw new Error("Image buffer must be defined");if(t.height===void 0||t.width===void 0)throw new Error("Image height and width must be defined");if(t.tensorLayout==="NHWC")throw new Error("NHWC Tensor layout is not supported yet");let{height:r,width:i}=t,a=t.norm??{mean:255,bias:0},n,s;typeof a.mean=="number"?n=[a.mean,a.mean,a.mean,a.mean]:n=[a.mean[0],a.mean[1],a.mean[2],a.mean[3]??255],typeof a.bias=="number"?s=[a.bias,a.bias,a.bias,a.bias]:s=[a.bias[0],a.bias[1],a.bias[2],a.bias[3]??0];let o=t.format!==void 0?t.format:"RGBA",u=t.tensorFormat!==void 0&&t.tensorFormat!==void 0?t.tensorFormat:"RGB",l=r*i,d=u==="RGBA"?new Float32Array(l*4):new Float32Array(l*3),p=4,h=0,f=1,m=2,y=3,$=0,_=l,w=l*2,S=-1;o==="RGB"&&(p=3,h=0,f=1,m=2,y=-1),u==="RGBA"?S=l*3:u==="RBG"?($=0,w=l,_=l*2):u==="BGR"&&(w=0,_=l,$=l*2);for(let x=0;x<l;x++,h+=p,m+=p,f+=p,y+=p)d[$++]=(e[h]+s[0])/n[0],d[_++]=(e[f]+s[1])/n[1],d[w++]=(e[m]+s[2])/n[2],S!==-1&&y!==-1&&(d[S++]=(e[y]+s[3])/n[3]);return u==="RGBA"?new Be("float32",d,[1,4,r,i]):new Be("float32",d,[1,3,r,i])},wt=async(e,t)=>{let r=typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement,i=typeof ImageData<"u"&&e instanceof ImageData,a=typeof ImageBitmap<"u"&&e instanceof ImageBitmap,n=typeof e=="string",s,o=t??{},u=()=>{if(typeof document<"u")return document.createElement("canvas");if(typeof OffscreenCanvas<"u")return new OffscreenCanvas(1,1);throw new Error("Canvas is not supported")},l=d=>typeof HTMLCanvasElement<"u"&&d instanceof HTMLCanvasElement||d instanceof OffscreenCanvas?d.getContext("2d"):null;if(r){let d=u();d.width=e.width,d.height=e.height;let p=l(d);if(p!=null){let h=e.height,f=e.width;if(t!==void 0&&t.resizedHeight!==void 0&&t.resizedWidth!==void 0&&(h=t.resizedHeight,f=t.resizedWidth),t!==void 0){if(o=t,t.tensorFormat!==void 0)throw new Error("Image input config format must be RGBA for HTMLImageElement");o.tensorFormat="RGBA",o.height=h,o.width=f}else o.tensorFormat="RGBA",o.height=h,o.width=f;p.drawImage(e,0,0),s=p.getImageData(0,0,f,h).data}else throw new Error("Can not access image data")}else if(i){let d,p;if(t!==void 0&&t.resizedWidth!==void 0&&t.resizedHeight!==void 0?(d=t.resizedHeight,p=t.resizedWidth):(d=e.height,p=e.width),t!==void 0&&(o=t),o.format="RGBA",o.height=d,o.width=p,t!==void 0){let h=u();h.width=p,h.height=d;let f=l(h);if(f!=null)f.putImageData(e,0,0),s=f.getImageData(0,0,p,d).data;else throw new Error("Can not access image data")}else s=e.data}else if(a){if(t===void 0)throw new Error("Please provide image config with format for Imagebitmap");let d=u();d.width=e.width,d.height=e.height;let p=l(d);if(p!=null){let h=e.height,f=e.width;return p.drawImage(e,0,0,f,h),s=p.getImageData(0,0,f,h).data,o.height=h,o.width=f,ut(s,o)}else throw new Error("Can not access image data")}else{if(n)return new Promise((d,p)=>{let h=u(),f=l(h);if(!e||!f)return p();let m=new Image;m.crossOrigin="Anonymous",m.src=e,m.onload=()=>{h.width=m.width,h.height=m.height,f.drawImage(m,0,0,h.width,h.height);let y=f.getImageData(0,0,h.width,h.height);o.height=h.height,o.width=h.width,d(ut(y.data,o))}});throw new Error("Input data provided is not supported - aborted tensor creation")}if(s!==void 0)return ut(s,o);throw new Error("Input data provided is not supported - aborted tensor creation")},wr=(e,t)=>{let{width:r,height:i,download:a,dispose:n}=t,s=[1,i,r,4];return new Be({location:"texture",type:"float32",texture:e,dims:s,download:a,dispose:n})},_r=(e,t)=>{let{dataType:r,dims:i,download:a,dispose:n}=t;return new Be({location:"gpu-buffer",type:r??"float32",gpuBuffer:e,dims:i,download:a,dispose:n})},Oe=(e,t)=>{let{dataType:r,dims:i,download:a,dispose:n}=t;return new Be({location:"ml-tensor",type:r??"float32",mlTensor:e,dims:i,download:a,dispose:n})},It=(e,t,r)=>new Be({location:"cpu-pinned",type:e,data:t,dims:r??[t.length]})}),tt,Ot,br,Ti,Qa=I(()=>{tt=new Map([["float32",Float32Array],["uint8",Uint8Array],["int8",Int8Array],["uint16",Uint16Array],["int16",Int16Array],["int32",Int32Array],["bool",Uint8Array],["float64",Float64Array],["uint32",Uint32Array],["int4",Uint8Array],["uint4",Uint8Array]]),Ot=new Map([[Float32Array,"float32"],[Uint8Array,"uint8"],[Int8Array,"int8"],[Uint16Array,"uint16"],[Int16Array,"int16"],[Int32Array,"int32"],[Float64Array,"float64"],[Uint32Array,"uint32"]]),br=!1,Ti=()=>{if(!br){br=!0;let e=typeof BigInt64Array<"u"&&BigInt64Array.from,t=typeof BigUint64Array<"u"&&BigUint64Array.from,r=globalThis.Float16Array,i=typeof r<"u"&&r.from;e&&(tt.set("int64",BigInt64Array),Ot.set(BigInt64Array,"int64")),t&&(tt.set("uint64",BigUint64Array),Ot.set(BigUint64Array,"uint64")),i?(tt.set("float16",r),Ot.set(r,"float16")):tt.set("float16",Uint16Array)}}}),Ei,ki,Xa=I(()=>{$r(),Ei=e=>{let t=1;for(let r=0;r<e.length;r++){let i=e[r];if(typeof i!="number"||!Number.isSafeInteger(i))throw new TypeError(`dims[${r}] must be an integer, got: ${i}`);if(i<0)throw new RangeError(`dims[${r}] must be a non-negative integer, got: ${i}`);t*=i}return t},ki=(e,t)=>{switch(e.location){case"cpu":return new Be(e.type,e.data,t);case"cpu-pinned":return new Be({location:"cpu-pinned",data:e.data,type:e.type,dims:t});case"texture":return new Be({location:"texture",texture:e.texture,type:e.type,dims:t});case"gpu-buffer":return new Be({location:"gpu-buffer",gpuBuffer:e.gpuBuffer,type:e.type,dims:t});case"ml-tensor":return new Be({location:"ml-tensor",mlTensor:e.mlTensor,type:e.type,dims:t});default:throw new Error(`tensorReshape: tensor location ${e.location} is not supported`)}}}),Be,$r=I(()=>{nr(),Si(),Qa(),Xa(),Be=class{constructor(e,t,r){Ti();let i,a;if(typeof e=="object"&&"location"in e)switch(this.dataLocation=e.location,i=e.type,a=e.dims,e.location){case"cpu-pinned":{let s=tt.get(i);if(!s)throw new TypeError(`unsupported type "${i}" to create tensor from pinned buffer`);if(!(e.data instanceof s))throw new TypeError(`buffer should be of type ${s.name}`);this.cpuData=e.data;break}case"texture":{if(i!=="float32")throw new TypeError(`unsupported type "${i}" to create tensor from texture`);this.gpuTextureData=e.texture,this.downloader=e.download,this.disposer=e.dispose;break}case"gpu-buffer":{if(i!=="float32"&&i!=="float16"&&i!=="int32"&&i!=="int64"&&i!=="uint32"&&i!=="uint8"&&i!=="bool"&&i!=="uint4"&&i!=="int4")throw new TypeError(`unsupported type "${i}" to create tensor from gpu buffer`);this.gpuBufferData=e.gpuBuffer,this.downloader=e.download,this.disposer=e.dispose;break}case"ml-tensor":{if(i!=="float32"&&i!=="float16"&&i!=="int32"&&i!=="int64"&&i!=="uint32"&&i!=="uint64"&&i!=="int8"&&i!=="uint8"&&i!=="bool"&&i!=="uint4"&&i!=="int4")throw new TypeError(`unsupported type "${i}" to create tensor from MLTensor`);this.mlTensorData=e.mlTensor,this.downloader=e.download,this.disposer=e.dispose;break}default:throw new Error(`Tensor constructor: unsupported location '${this.dataLocation}'`)}else{let s,o;if(typeof e=="string")if(i=e,o=r,e==="string"){if(!Array.isArray(t))throw new TypeError("A string tensor's data must be a string array.");s=t}else{let u=tt.get(e);if(u===void 0)throw new TypeError(`Unsupported tensor type: ${e}.`);if(Array.isArray(t)){if(e==="float16"&&u===Uint16Array||e==="uint4"||e==="int4")throw new TypeError(`Creating a ${e} tensor from number array is not supported. Please use ${u.name} as data.`);e==="uint64"||e==="int64"?s=u.from(t,BigInt):s=u.from(t)}else if(t instanceof u)s=t;else if(t instanceof Uint8ClampedArray)if(e==="uint8")s=Uint8Array.from(t);else throw new TypeError("A Uint8ClampedArray tensor's data must be type of uint8");else if(e==="float16"&&t instanceof Uint16Array&&u!==Uint16Array)s=new globalThis.Float16Array(t.buffer,t.byteOffset,t.length);else throw new TypeError(`A ${i} tensor's data must be type of ${u}`)}else if(o=t,Array.isArray(e)){if(e.length===0)throw new TypeError("Tensor type cannot be inferred from an empty array.");let u=typeof e[0];if(u==="string")i="string",s=e;else if(u==="boolean")i="bool",s=Uint8Array.from(e);else throw new TypeError(`Invalid element type of data array: ${u}.`)}else if(e instanceof Uint8ClampedArray)i="uint8",s=Uint8Array.from(e);else{let u=Ot.get(e.constructor);if(u===void 0)throw new TypeError(`Unsupported type for tensor data: ${e.constructor}.`);i=u,s=e}if(o===void 0)o=[s.length];else if(!Array.isArray(o))throw new TypeError("A tensor's dims must be a number array");a=o,this.cpuData=s,this.dataLocation="cpu"}let n=Ei(a);if(this.cpuData&&n!==this.cpuData.length&&!((i==="uint4"||i==="int4")&&Math.ceil(n/2)===this.cpuData.length))throw new Error(`Tensor's size(${n}) does not match data length(${this.cpuData.length}).`);this.type=i,this.dims=a,this.size=n}static async fromImage(e,t){return wt(e,t)}static fromTexture(e,t){return wr(e,t)}static fromGpuBuffer(e,t){return _r(e,t)}static fromMLTensor(e,t){return Oe(e,t)}static fromPinnedBuffer(e,t,r){return It(e,t,r)}toDataURL(e){return qe(this,e)}toImageData(e){return ft(this,e)}get data(){if(this.ensureValid(),!this.cpuData)throw new Error("The data is not on CPU. Use `getData()` to download GPU data to CPU, or use `texture` or `gpuBuffer` property to access the GPU data directly.");return this.cpuData}get location(){return this.dataLocation}get texture(){if(this.ensureValid(),!this.gpuTextureData)throw new Error("The data is not stored as a WebGL texture.");return this.gpuTextureData}get gpuBuffer(){if(this.ensureValid(),!this.gpuBufferData)throw new Error("The data is not stored as a WebGPU buffer.");return this.gpuBufferData}get mlTensor(){if(this.ensureValid(),!this.mlTensorData)throw new Error("The data is not stored as a WebNN MLTensor.");return this.mlTensorData}async getData(e){switch(this.ensureValid(),this.dataLocation){case"cpu":case"cpu-pinned":return this.data;case"texture":case"gpu-buffer":case"ml-tensor":{if(!this.downloader)throw new Error("The current tensor is not created with a specified data downloader.");if(this.isDownloading)throw new Error("The current tensor is being downloaded.");try{this.isDownloading=!0;let t=await this.downloader();return this.downloader=void 0,this.dataLocation="cpu",this.cpuData=t,e&&this.disposer&&(this.disposer(),this.disposer=void 0),t}finally{this.isDownloading=!1}}default:throw new Error(`cannot get data from location: ${this.dataLocation}`)}}dispose(){if(this.isDownloading)throw new Error("The current tensor is being downloaded.");this.disposer&&(this.disposer(),this.disposer=void 0),this.cpuData=void 0,this.gpuTextureData=void 0,this.gpuBufferData=void 0,this.mlTensorData=void 0,this.downloader=void 0,this.isDownloading=void 0,this.dataLocation="none"}ensureValid(){if(this.dataLocation==="none")throw new Error("The tensor is disposed.")}reshape(e){if(this.ensureValid(),this.downloader||this.disposer)throw new Error("Cannot reshape a tensor that owns GPU resource.");return ki(this,e)}}}),We,Ii=I(()=>{$r(),We=Be}),Gt,vr,Je,Ze,lt,dt,Ci=I(()=>{Ne(),Gt=(e,t)=>{(typeof ce.trace>"u"?!ce.wasm.trace:!ce.trace)||console.timeStamp(`${e}::ORT::${t}`)},vr=(e,t)=>{var a;let r=((a=new Error().stack)==null?void 0:a.split(/\r\n|\r|\n/g))||[],i=!1;for(let n=0;n<r.length;n++){if(i&&!r[n].includes("TRACE_FUNC")){let s=`FUNC_${e}::${r[n].trim().split(" ")[1]}`;t&&(s+=`::${t}`),Gt("CPU",s);return}r[n].includes("TRACE_FUNC")&&(i=!0)}},Je=e=>{(typeof ce.trace>"u"?!ce.wasm.trace:!ce.trace)||vr("BEGIN",e)},Ze=e=>{(typeof ce.trace>"u"?!ce.wasm.trace:!ce.trace)||vr("END",e)},lt=e=>{(typeof ce.trace>"u"?!ce.wasm.trace:!ce.trace)||console.time(`ORT::${e}`)},dt=e=>{(typeof ce.trace>"u"?!ce.wasm.trace:!ce.trace)||console.timeEnd(`ORT::${e}`)}}),zi,Ya=I(()=>{yt(),Ii(),Ci(),zi=class lc{constructor(t){this.handler=t}async run(t,r,i){Je(),lt("InferenceSession.run");let a={},n={};if(typeof t!="object"||t===null||t instanceof We||Array.isArray(t))throw new TypeError("'feeds' must be an object that use input names as keys and OnnxValue as corresponding values.");let s=!0;if(typeof r=="object"){if(r===null)throw new TypeError("Unexpected argument[1]: cannot be null.");if(r instanceof We)throw new TypeError("'fetches' cannot be a Tensor");if(Array.isArray(r)){if(r.length===0)throw new TypeError("'fetches' cannot be an empty array.");s=!1;for(let l of r){if(typeof l!="string")throw new TypeError("'fetches' must be a string array or an object.");if(this.outputNames.indexOf(l)===-1)throw new RangeError(`'fetches' contains invalid output name: ${l}.`);a[l]=null}if(typeof i=="object"&&i!==null)n=i;else if(typeof i<"u")throw new TypeError("'options' must be an object.")}else{let l=!1,d=Object.getOwnPropertyNames(r);for(let p of this.outputNames)if(d.indexOf(p)!==-1){let h=r[p];(h===null||h instanceof We)&&(l=!0,s=!1,a[p]=h)}if(l){if(typeof i=="object"&&i!==null)n=i;else if(typeof i<"u")throw new TypeError("'options' must be an object.")}else n=r}}else if(typeof r<"u")throw new TypeError("Unexpected argument[1]: must be 'fetches' or 'options'.");for(let l of this.inputNames)if(typeof t[l]>"u")throw new Error(`input '${l}' is missing in 'feeds'.`);if(s)for(let l of this.outputNames)a[l]=null;let o=await this.handler.run(t,a,n),u={};for(let l in o)if(Object.hasOwnProperty.call(o,l)){let d=o[l];d instanceof We?u[l]=d:u[l]=new We(d.type,d.data,d.dims)}return dt("InferenceSession.run"),Ze(),u}async release(){return this.handler.dispose()}static async create(t,r,i,a){Je(),lt("InferenceSession.create");let n,s={};if(typeof t=="string"){if(n=t,typeof r=="object"&&r!==null)s=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof Uint8Array){if(n=t,typeof r=="object"&&r!==null)s=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof ArrayBuffer||typeof SharedArrayBuffer<"u"&&t instanceof SharedArrayBuffer){let d=t,p=0,h=t.byteLength;if(typeof r=="object"&&r!==null)s=r;else if(typeof r=="number"){if(p=r,!Number.isSafeInteger(p))throw new RangeError("'byteOffset' must be an integer.");if(p<0||p>=d.byteLength)throw new RangeError(`'byteOffset' is out of range [0, ${d.byteLength}).`);if(h=t.byteLength-p,typeof i=="number"){if(h=i,!Number.isSafeInteger(h))throw new RangeError("'byteLength' must be an integer.");if(h<=0||p+h>d.byteLength)throw new RangeError(`'byteLength' is out of range (0, ${d.byteLength-p}].`);if(typeof a=="object"&&a!==null)s=a;else if(typeof a<"u")throw new TypeError("'options' must be an object.")}else if(typeof i<"u")throw new TypeError("'byteLength' must be a number.")}else if(typeof r<"u")throw new TypeError("'options' must be an object.");n=new Uint8Array(d,p,h)}else throw new TypeError("Unexpected argument[0]: must be 'path' or 'buffer'.");let[o,u]=await Ge(s),l=await o.createInferenceSessionHandler(n,u);return dt("InferenceSession.create"),Ze(),new lc(l)}startProfiling(){this.handler.startProfiling()}endProfiling(){this.handler.endProfiling()}get inputNames(){return this.handler.inputNames}get outputNames(){return this.handler.outputNames}get inputMetadata(){return this.handler.inputMetadata}get outputMetadata(){return this.handler.outputMetadata}}}),xr,Ja=I(()=>{Ya(),xr=zi}),en=I(()=>{}),tn=I(()=>{}),rn=I(()=>{}),an=I(()=>{}),Ai={};ye(Ai,{InferenceSession:()=>xr,TRACE:()=>Gt,TRACE_EVENT_BEGIN:()=>lt,TRACE_EVENT_END:()=>dt,TRACE_FUNC_BEGIN:()=>Je,TRACE_FUNC_END:()=>Ze,Tensor:()=>We,env:()=>te,registerBackend:()=>we});var Qe=I(()=>{At(),ot(),Ja(),Ii(),en(),tn(),Ci(),rn(),an()}),Sr=I(()=>{}),Oi={};ye(Oi,{default:()=>Ri});var Tr,Er,Ri,nn=I(()=>{var e;Dp(),_t(),Ar(),Tr="ort-wasm-proxy-worker",Er=((e=globalThis.self)==null?void 0:e.name)===Tr,Er&&(self.onmessage=t=>{let{type:r,in:i}=t.data;try{switch(r){case"init-wasm":Br(i.wasm).then(()=>{Yn(i).then(()=>{postMessage({type:r})},a=>{postMessage({type:r,err:a})})},a=>{postMessage({type:r,err:a})});break;case"init-ep":{let{epName:a,env:n}=i;Jn(n,a).then(()=>{postMessage({type:r})},s=>{postMessage({type:r,err:s})});break}case"copy-from":{let{buffer:a}=i,n=La(a);postMessage({type:r,out:n});break}case"create":{let{model:a,options:n}=i;ts(a,n).then(s=>{postMessage({type:r,out:s})},s=>{postMessage({type:r,err:s})});break}case"release":rs(i),postMessage({type:r});break;case"run":{let{sessionId:a,inputIndices:n,inputs:s,outputIndices:o,options:u}=i;as(a,n,s,o,new Array(o.length).fill(null),u).then(l=>{l.some(d=>d[3]!=="cpu")?postMessage({type:r,err:"Proxy does not support non-cpu tensor location."}):postMessage({type:r,out:l},ss([...s,...l]))},l=>{postMessage({type:r,err:l})});break}case"end-profiling":ns(i),postMessage({type:r});break;default:}}catch(a){postMessage({type:r,err:a})}}),Ri=Er?null:t=>new Worker(t??Me,{type:"classic",name:Tr})}),Bi,Mi,Me,kr,Jt,Di,Pi,Ir,Ui,Cr,Ni,zr,Li,Ar=I(()=>{Sr(),Bi=typeof location>"u"?void 0:location.origin,Mi=()=>{var e,t;return typeof document<"u"?(e=document.currentScript)==null?void 0:e.src:typeof self<"u"?(t=self.location)==null?void 0:t.href:void 0},Me=Mi(),kr=()=>{if(Me&&!Me.startsWith("blob:"))return Me.substring(0,Me.lastIndexOf("/")+1)},Jt=(e,t)=>{try{let r=t??Me;return(r?new URL(e,r):new URL(e)).origin===Bi}catch{return!1}},Di=(e,t)=>{let r=t??Me;try{return(r?new URL(e,r):new URL(e)).href}catch{return}},Pi=(e,t)=>`${t??"./"}${e}`,Ir=async e=>{let t=await(await fetch(e,{credentials:"same-origin"})).blob();return URL.createObjectURL(t)},Ui=async e=>(await import(e)).default,Cr=(nn(),Le(Oi)).default,Ni=async()=>{if(!Me)throw new Error("Failed to load proxy worker: cannot determine the script source URL.");if(Jt(Me))return[void 0,Cr()];let e=await Ir(Me);return[e,Cr(e)]},zr=void 0,Li=async(e,t,r,i)=>{let a=zr&&!(e||t);if(a)if(Me)a=Jt(Me);else if(i&&!r)a=!0;else throw new Error("cannot determine the script source URL.");if(a)return[void 0,zr];{let n="ort-wasm-simd-threaded.jsep.mjs",s=e??Di(n,t),o=r&&s&&!Jt(s,t),u=o?await Ir(s):s??Pi(n,t);return[o?u:void 0,await Ui(u)]}}}),Or,er,Rt,Rr,Vi,Wi,Fi,Br,he,_t=I(()=>{Ar(),er=!1,Rt=!1,Rr=!1,Vi=()=>{if(typeof SharedArrayBuffer>"u")return!1;try{return typeof MessageChannel<"u"&&new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)),WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,5,4,1,3,1,1,10,11,1,9,0,65,0,254,16,2,0,26,11]))}catch{return!1}},Wi=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,10,30,1,28,0,65,0,253,15,253,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,253,186,1,26,11]))}catch{return!1}},Fi=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,19,1,17,0,65,1,253,15,65,2,253,15,65,3,253,15,253,147,2,11]))}catch{return!1}},Br=async e=>{if(er)return Promise.resolve();if(Rt)throw new Error("multiple calls to 'initializeWebAssembly()' detected.");if(Rr)throw new Error("previous call to 'initializeWebAssembly()' failed.");Rt=!0;let t=e.initTimeout,r=e.numThreads;if(e.simd!==!1){if(e.simd==="relaxed"){if(!Fi())throw new Error("Relaxed WebAssembly SIMD is not supported in the current environment.")}else if(!Wi())throw new Error("WebAssembly SIMD is not supported in the current environment.")}let i=Vi();r>1&&!i&&(typeof self<"u"&&!self.crossOriginIsolated&&console.warn("env.wasm.numThreads is set to "+r+", but this will not work unless you enable crossOriginIsolated mode. See https://web.dev/cross-origin-isolation-guide/ for more info."),console.warn("WebAssembly multi-threading is not supported in the current environment. Falling back to single-threading."),e.numThreads=r=1);let a=e.wasmPaths,n=typeof a=="string"?a:void 0,s=a==null?void 0:a.mjs,o=(s==null?void 0:s.href)??s,u=a==null?void 0:a.wasm,l=(u==null?void 0:u.href)??u,d=e.wasmBinary,[p,h]=await Li(o,n,r>1,!!d||!!l),f=!1,m=[];if(t>0&&m.push(new Promise(y=>{setTimeout(()=>{f=!0,y()},t)})),m.push(new Promise((y,$)=>{let _={numThreads:r};if(d)_.wasmBinary=d;else if(l||n)_.locateFile=w=>l??n+w;else if(o&&o.indexOf("blob:")!==0)_.locateFile=w=>new URL(w,o).href;else if(p){let w=kr();w&&(_.locateFile=S=>w+S)}h(_).then(w=>{Rt=!1,er=!0,Or=w,y(),p&&URL.revokeObjectURL(p)},w=>{Rt=!1,Rr=!0,$(w)})})),await Promise.race(m),f)throw new Error(`WebAssembly backend initializing failed due to timeout: ${t}ms`)},he=()=>{if(er&&Or)return Or;throw new Error("WebAssembly is not initialized yet.")}}),Fe,tr,le,Mr=I(()=>{_t(),Fe=(e,t)=>{let r=he(),i=r.lengthBytesUTF8(e)+1,a=r._malloc(i);return r.stringToUTF8(e,a,i),t.push(a),a},tr=(e,t,r,i)=>{if(typeof e=="object"&&e!==null){if(r.has(e))throw new Error("Circular reference in options");r.add(e)}Object.entries(e).forEach(([a,n])=>{let s=t?t+a:a;if(typeof n=="object")tr(n,s+".",r,i);else if(typeof n=="string"||typeof n=="number")i(s,n.toString());else if(typeof n=="boolean")i(s,n?"1":"0");else throw new Error(`Can't handle extra config type: ${typeof n}`)})},le=e=>{let t=he(),r=t.stackSave();try{let i=t.PTR_SIZE,a=t.stackAlloc(2*i);t._OrtGetLastError(a,a+i);let n=Number(t.getValue(a,i===4?"i32":"i64")),s=t.getValue(a+i,"*"),o=s?t.UTF8ToString(s):"";throw new Error(`${e} ERROR_CODE: ${n}, ERROR_MESSAGE: ${o}`)}finally{t.stackRestore(r)}}}),qi,sn=I(()=>{_t(),Mr(),qi=e=>{let t=he(),r=0,i=[],a=e||{};try{if((e==null?void 0:e.logSeverityLevel)===void 0)a.logSeverityLevel=2;else if(typeof e.logSeverityLevel!="number"||!Number.isInteger(e.logSeverityLevel)||e.logSeverityLevel<0||e.logSeverityLevel>4)throw new Error(`log severity level is not valid: ${e.logSeverityLevel}`);if((e==null?void 0:e.logVerbosityLevel)===void 0)a.logVerbosityLevel=0;else if(typeof e.logVerbosityLevel!="number"||!Number.isInteger(e.logVerbosityLevel))throw new Error(`log verbosity level is not valid: ${e.logVerbosityLevel}`);(e==null?void 0:e.terminate)===void 0&&(a.terminate=!1);let n=0;return(e==null?void 0:e.tag)!==void 0&&(n=Fe(e.tag,i)),r=t._OrtCreateRunOptions(a.logSeverityLevel,a.logVerbosityLevel,!!a.terminate,n),r===0&&le("Can't create run options."),(e==null?void 0:e.extra)!==void 0&&tr(e.extra,"",new WeakSet,(s,o)=>{let u=Fe(s,i),l=Fe(o,i);t._OrtAddRunConfigEntry(r,u,l)!==0&&le(`Can't set a run config entry: ${s} - ${o}.`)}),[r,i]}catch(n){throw r!==0&&t._OrtReleaseRunOptions(r),i.forEach(s=>t._free(s)),n}}}),Gi,ji,Hi,Bt,Ki,Zi,on=I(()=>{_t(),Mr(),Gi=e=>{switch(e){case"disabled":return 0;case"basic":return 1;case"extended":return 2;case"layout":return 3;case"all":return 99;default:throw new Error(`unsupported graph optimization level: ${e}`)}},ji=e=>{switch(e){case"sequential":return 0;case"parallel":return 1;default:throw new Error(`unsupported execution mode: ${e}`)}},Hi=e=>{e.extra||(e.extra={}),e.extra.session||(e.extra.session={});let t=e.extra.session;t.use_ort_model_bytes_directly||(t.use_ort_model_bytes_directly="1"),e.executionProviders&&e.executionProviders.some(r=>(typeof r=="string"?r:r.name)==="webgpu")&&(e.enableMemPattern=!1)},Bt=(e,t,r,i)=>{let a=Fe(t,i),n=Fe(r,i);he()._OrtAddSessionConfigEntry(e,a,n)!==0&&le(`Can't set a session config entry: ${t} - ${r}.`)},Ki=async(e,t,r)=>{for(let i of t){let a=typeof i=="string"?i:i.name,n=[];switch(a){case"webnn":if(a="WEBNN",typeof i!="string"){let d=i==null?void 0:i.deviceType;d&&Bt(e,"deviceType",d,r)}break;case"webgpu":if(a="JS",typeof i!="string"){let d=i;if(d!=null&&d.preferredLayout){if(d.preferredLayout!=="NCHW"&&d.preferredLayout!=="NHWC")throw new Error(`preferredLayout must be either 'NCHW' or 'NHWC': ${d.preferredLayout}`);Bt(e,"preferredLayout",d.preferredLayout,r)}}break;case"wasm":case"cpu":continue;default:throw new Error(`not supported execution provider: ${a}`)}let s=Fe(a,r),o=n.length,u=0,l=0;if(o>0){u=he()._malloc(o*he().PTR_SIZE),r.push(u),l=he()._malloc(o*he().PTR_SIZE),r.push(l);for(let d=0;d<o;d++)he().setValue(u+d*he().PTR_SIZE,n[d][0],"*"),he().setValue(l+d*he().PTR_SIZE,n[d][1],"*")}await he()._OrtAppendExecutionProvider(e,s,u,l,o)!==0&&le(`Can't append execution provider: ${a}.`)}},Zi=async e=>{let t=he(),r=0,i=[],a=e||{};Hi(a);try{let n=Gi(a.graphOptimizationLevel??"all"),s=ji(a.executionMode??"sequential"),o=typeof a.logId=="string"?Fe(a.logId,i):0,u=a.logSeverityLevel??2;if(!Number.isInteger(u)||u<0||u>4)throw new Error(`log severity level is not valid: ${u}`);let l=a.logVerbosityLevel??0;if(!Number.isInteger(l)||l<0||l>4)throw new Error(`log verbosity level is not valid: ${l}`);let d=typeof a.optimizedModelFilePath=="string"?Fe(a.optimizedModelFilePath,i):0;if(r=t._OrtCreateSessionOptions(n,!!a.enableCpuMemArena,!!a.enableMemPattern,s,!!a.enableProfiling,0,o,u,l,d),r===0&&le("Can't create session options."),a.executionProviders&&await Ki(r,a.executionProviders,i),a.enableGraphCapture!==void 0){if(typeof a.enableGraphCapture!="boolean")throw new Error(`enableGraphCapture must be a boolean value: ${a.enableGraphCapture}`);Bt(r,"enableGraphCapture",a.enableGraphCapture.toString(),i)}if(a.freeDimensionOverrides)for(let[p,h]of Object.entries(a.freeDimensionOverrides)){if(typeof p!="string")throw new Error(`free dimension override name must be a string: ${p}`);if(typeof h!="number"||!Number.isInteger(h)||h<0)throw new Error(`free dimension override value must be a non-negative integer: ${h}`);let f=Fe(p,i);t._OrtAddFreeDimensionOverride(r,f,h)!==0&&le(`Can't set a free dimension override: ${p} - ${h}.`)}return a.extra!==void 0&&tr(a.extra,"",new WeakSet,(p,h)=>{Bt(r,p,h,i)}),[r,i]}catch(n){throw r!==0&&t._OrtReleaseSessionOptions(r)!==0&&le("Can't release session options."),i.forEach(s=>t._free(s)),n}}}),bt,$t,vt,Dr,Pr,Ur,Nr,ii,pe=I(()=>{bt=e=>{switch(e){case"int8":return 3;case"uint8":return 2;case"bool":return 9;case"int16":return 5;case"uint16":return 4;case"int32":return 6;case"uint32":return 12;case"float16":return 10;case"float32":return 1;case"float64":return 11;case"string":return 8;case"int64":return 7;case"uint64":return 13;case"int4":return 22;case"uint4":return 21;default:throw new Error(`unsupported data type: ${e}`)}},$t=e=>{switch(e){case 3:return"int8";case 2:return"uint8";case 9:return"bool";case 5:return"int16";case 4:return"uint16";case 6:return"int32";case 12:return"uint32";case 10:return"float16";case 1:return"float32";case 11:return"float64";case 8:return"string";case 7:return"int64";case 13:return"uint64";case 22:return"int4";case 21:return"uint4";default:throw new Error(`unsupported data type: ${e}`)}},vt=(e,t)=>{let r=[-1,4,1,1,2,2,4,8,-1,1,2,8,4,8,-1,-1,-1,-1,-1,-1,-1,.5,.5][e],i=typeof t=="number"?t:t.reduce((a,n)=>a*n,1);return r>0?Math.ceil(i*r):void 0},Dr=e=>{switch(e){case"float16":return typeof Float16Array<"u"&&Float16Array.from?Float16Array:Uint16Array;case"float32":return Float32Array;case"uint8":return Uint8Array;case"int8":return Int8Array;case"uint16":return Uint16Array;case"int16":return Int16Array;case"int32":return Int32Array;case"bool":return Uint8Array;case"float64":return Float64Array;case"uint32":return Uint32Array;case"int64":return BigInt64Array;case"uint64":return BigUint64Array;default:throw new Error(`unsupported type: ${e}`)}},Pr=e=>{switch(e){case"verbose":return 0;case"info":return 1;case"warning":return 2;case"error":return 3;case"fatal":return 4;default:throw new Error(`unsupported logging level: ${e}`)}},Ur=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",Nr=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint64"||e==="int8"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",ii=e=>{switch(e){case"none":return 0;case"cpu":return 1;case"cpu-pinned":return 2;case"texture":return 3;case"gpu-buffer":return 4;case"ml-tensor":return 5;default:throw new Error(`unsupported data location: ${e}`)}}}),Lr,Qi=I(()=>{Sr(),Lr=async e=>{if(typeof e=="string"){let t=await fetch(e);if(!t.ok)throw new Error(`failed to load external data file: ${e}`);let r=t.headers.get("Content-Length"),i=r?parseInt(r,10):0;if(i<1073741824)return new Uint8Array(await t.arrayBuffer());{if(!t.body)throw new Error(`failed to load external data file: ${e}, no response body.`);let a=t.body.getReader(),n;try{n=new ArrayBuffer(i)}catch(o){if(o instanceof RangeError){let u=Math.ceil(i/65536);n=new WebAssembly.Memory({initial:u,maximum:u}).buffer}else throw o}let s=0;for(;;){let{done:o,value:u}=await a.read();if(o)break;let l=u.byteLength;new Uint8Array(n,s,l).set(u),s+=l}return new Uint8Array(n,0,i)}}else return e instanceof Blob?new Uint8Array(await e.arrayBuffer()):e instanceof Uint8Array?e:new Uint8Array(e)}}),Xi,ai,ni,jt,si,oi,Te,Tt=I(()=>{pe(),Xi=["V","I","W","E","F"],ai=(e,t)=>{console.log(`[${Xi[e]},${new Date().toISOString()}]${t}`)},si=(e,t)=>{ni=e,jt=t},oi=(e,t)=>{let r=Pr(e),i=Pr(ni);r>=i&&ai(r,typeof t=="function"?t():t)},Te=(...e)=>{jt&&oi(...e)}}),ui,Ht,U,sr,li,Yi,Mt,ae=I(()=>{ui=class{static calcMatMulShape(e,t){return e[1]!==t[0]?void 0:[e[0],t[1]]}},Ht=class{static calcShape(e,t,r=!1){let i=e.length,a=t.length;if(i===0)return t;if(a===0)return e;let n=Math.max(e.length,t.length),s=new Array(n);if(r){if(i<2||a<2)return;let o=ui.calcMatMulShape([e[i-2],e[i-1]],[t[a-2],t[a-1]]);if(o===void 0)return;[s[n-2],s[n-1]]=o}for(let o=r?3:1;o<=n;o++){let u=i-o<0?1:e[i-o],l=a-o<0?1:t[a-o];if(u!==l&&u>1&&l>1)return;let d=Math.max(u,l);if(u&&l)s[n-o]=Math.max(u,l);else{if(d>1)return;s[n-o]=0}}return s}static isValidBroadcast(e,t){let r=e.length,i=t.length;if(r>i)return!1;for(let a=1;a<=r;a++)if(e[r-a]!==1&&e[r-a]!==t[i-a])return!1;return!0}},U=class Ga{static size(t){return Ga.getSizeFromDimensionRange(t,0,t.length)}static convertShape(t,r=4){let i=t.length;if(i===0)return[];let a=new Array(i),n=i-1;for(;n>=0;){if(t[n]%r===0){a[n]=t[n]/r;break}if(r%t[n]!==0)throw new Error("cannot convert shape");a[n]=1,r/=t[n],n--}for(n--;n>=0;n--)a[n]=t[n];return a}static sizeFromDimension(t,r){if(r<0||r>t.length)throw new Error(`invalid dimension of ${r} for sizeFromDimension as Tensor has ${t.length} dimensions.`);return Ga.getSizeFromDimensionRange(t,r,t.length)}static sizeToDimension(t,r){if(r<0||r>t.length)throw new Error(`invalid dimension of ${r} for sizeToDimension as Tensor has ${t.length} dimensions.`);return Ga.getSizeFromDimensionRange(t,0,r)}static getSizeFromDimensionRange(t,r,i){let a=1;for(let n=r;n<i;n++){if(t[n]<0)throw new Error("cannot get valid size from specified dimension range. Most likely the range contains negative values in them.");a*=Number(t[n])}return a}static computeStrides(t){let r=t.length;if(r===0)return[];if(r===1)return[1];let i=new Array(r);i[r-1]=1,i[r-2]=t[r-1];for(let a=r-3;a>=0;--a)i[a]=i[a+1]*t[a+1];return i}static normalizeAxis(t,r){if(t<-r&&t>=r)throw new Error("unsupported axis for this operation.");return t<0?t+r:t}static normalizeAxes(t,r){return t.map(i=>this.normalizeAxis(i,r??t.length))}static sortBasedOnPerm(t,r){return r?r.map(i=>t[i]):t.slice().reverse()}static padShape(t,r){let i=t.length;return t.map((a,n)=>a+r[n]+r[n+i])}static areEqual(t,r){return t.length!==r.length?!1:t.every((i,a)=>i===r[a])}},sr=class ba{static adjustPoolAttributes(t,r,i,a,n,s){if(!t&&i.length!==r.length-2)throw new Error("length of specified kernel shapes should be 2 less than length of input dimensions");if(t)for(let o=0;o<r.length-2;o++)o>=i.length?i.push(r[o+2]):i[o]=r[o+2];for(let o=0;o<i.length;o++)if(o<a.length){if(a[o]<0)throw new Error("strides should be greater than or equal to 1")}else a.push(1);for(let o=0;o<i.length;o++)if(o<n.length){if(n[o]<0)throw new Error("dilations should be greater than or equal to 1")}else n.push(1);for(let o=0;o<i.length*2;o++)if(o<s.length){if(s[o]<0)throw new Error("pad should be greater than or equal to 1")}else s.push(0);for(let o=0;o<i.length;o++){if(i[o]<=0)throw new Error("kernel shapes need to be greater than 0");if(s[o]>=i[o]||s[o+i.length]>=i[o])throw new Error("pads should be smaller than kernel")}}static adjustPadsBasedOnAutoPad(t,r,i,a,n,s,o){if(o){if(n.length!==2*(t.length-2))throw new Error("length of pads should be twice the length of data dimensions");if(r.length!==t.length-2)throw new Error("length of strides should be the length of data dimensions");if(a.length!==t.length-2)throw new Error("length of kernel shapes should be the length of data dimensions");for(let u=0;u<t.length-2;u++)ba.adjustPadAndReturnShape(t[u+(s?1:2)],r[u],i[u],a[u],n,u,u+t.length-2,o)}}static computePoolOutputShape(t,r,i,a,n,s,o){if(r.length<=0)throw new Error("input shape must be of size greater than 0");let u=[r[0],r[1]];return ba.computeShapeHelper(t,r,u,i,a,n,s,o),u}static computeConvOutputShape(t,r,i,a,n,s,o){if(t.length<=0||r.length<=0)throw new Error("invalid input tensor dims or invalid filter tensor dims");let u=[t[0],r[0]];return ba.computeShapeHelper(!1,t,u,i,a,n,s,o),u}static computeShapeHelper(t,r,i,a,n,s,o,u){if(t)for(let l=0;l<r.length-2;l++)i.push(1);else for(let l=0;l<r.length-2;l++)i.push(ba.adjustPadAndReturnShape(r[l+2],a[l],n[l],s[l],o,l,l+r.length-2,u))}static adjustPadAndReturnShape(t,r,i,a,n,s,o,u){let l=i*(a-1)+1;if(u&&u!=="NOTSET")switch(u){case"VALID":return n[s]=0,n[o]=0,Math.floor((t-l)/r+1);case"SAME_LOWER":case"SAME_UPPER":if(i!==1)throw new Error("Dilation not supported for SAME_UPPER or SAME_LOWER");{let d=((t+r-1)/r-1)*r+a-t;return n[s]=Math.floor(u==="SAME_LOWER"?(d+1)/2:d/2),n[o]=d-n[s],Math.floor((t+d-a)/r+1)}default:throw new Error("Unsupported AutoPad type")}else return Math.floor((t+n[s]+n[o]-l)/r+1)}},li=class{static getShapeOfGemmResult(e,t,r,i,a){if(e.length!==2||r.length!==2)throw new Error("shape need to be of size 2");let n,s,o;t?(n=e[1],s=e[0]):(n=e[0],s=e[1]);let u=-1;if(i?(o=r[0],u=1):(o=r[1],u=0),r[u]!==s)throw new Error("dimension mismatch");if(n<=0||o<=0||s<=0)throw new Error("invalid shape specified");if(a&&!Ht.isValidBroadcast(a,[n,o]))throw new Error("gemm: invalid bias shape for broadcast");return[n,o,s]}},Yi=-34028234663852886e22,Mt=34028234663852886e22}),Kt,or=I(()=>{pe(),Kt=(e,t)=>new(Dr(t))(e)}),rr,ur,Vr,Wr,Dt,Zt,di,pi,ci,Ji,ea,Ta=I(()=>{pe(),Tt(),rr=new Map([["float32",32],["float16",16],["int32",32],["uint32",32],["int64",64],["uint64",64],["int8",8],["uint8",8],["int4",4],["uint4",4]]),ur=(e,t)=>{if(t==="int32")return e;let r=rr.get(t);if(!r)throw new Error(`WebNN backend does not support data type: ${t}`);let i=r/8;if(e.byteLength%i!==0)throw new Error(`Invalid Uint8Array length - must be a multiple of ${i}.`);let a=e.byteLength/i,n=new(Dr(t))(e.buffer,e.byteOffset,a);switch(t){case"int64":case"uint64":{let s=new Int32Array(a);for(let o=0;o<a;o++){let u=n[o];if(u>2147483647n||u<-2147483648n)throw new Error("Can not convert int64 data to int32 - value out of range.");s[o]=Number(u)}return new Uint8Array(s.buffer)}case"int8":case"uint8":case"uint32":{if(t==="uint32"&&n.some(o=>o>2147483647))throw new Error("Can not convert uint32 data to int32 - value out of range.");let s=Int32Array.from(n,Number);return new Uint8Array(s.buffer)}default:throw new Error(`Unsupported data conversion from ${t} to 'int32'`)}},Vr=(e,t)=>{if(t==="int32")return e;if(e.byteLength%4!==0)throw new Error("Invalid Uint8Array length - must be a multiple of 4 (int32).");let r=e.byteLength/4,i=new Int32Array(e.buffer,e.byteOffset,r);switch(t){case"int64":{let a=BigInt64Array.from(i,BigInt);return new Uint8Array(a.buffer)}case"uint64":{if(i.some(n=>n<0))throw new Error("Can not convert int32 data to uin64 - negative value found.");let a=BigUint64Array.from(i,BigInt);return new Uint8Array(a.buffer)}case"int8":{if(i.some(n=>n<-128||n>127))throw new Error("Can not convert int32 data to int8 - value out of range.");let a=Int8Array.from(i,Number);return new Uint8Array(a.buffer)}case"uint8":{if(i.some(a=>a<0||a>255))throw new Error("Can not convert int32 data to uint8 - value out of range.");return Uint8Array.from(i,Number)}case"uint32":{if(i.some(n=>n<0))throw new Error("Can not convert int32 data to uint32 - negative value found.");let a=Uint32Array.from(i,Number);return new Uint8Array(a.buffer)}default:throw new Error(`Unsupported data conversion from 'int32' to ${t}`)}},Wr=1,Dt=()=>Wr++,Zt=new Map([["int8","int32"],["uint8","int32"],["uint32","int32"],["int64","int32"]]),di=(e,t)=>{let r=rr.get(e);if(!r)throw new Error(`WebNN backend does not support data type: ${e}`);return t.length>0?Math.ceil(t.reduce((i,a)=>i*a)*r/8):0},pi=class{constructor(e){this.isDataConverted=!1;let{sessionId:t,context:r,tensor:i,dataType:a,shape:n,fallbackDataType:s}=e;this.sessionId=t,this.mlContext=r,this.mlTensor=i,this.dataType=a,this.tensorShape=n,this.fallbackDataType=s}get tensor(){return this.mlTensor}get type(){return this.dataType}get fallbackType(){return this.fallbackDataType}get shape(){return this.tensorShape}get byteLength(){return di(this.dataType,this.tensorShape)}destroy(){Te("verbose",()=>"[WebNN] TensorWrapper.destroy"),this.mlTensor.destroy()}write(e){this.mlContext.writeTensor(this.mlTensor,e)}async read(e){if(this.fallbackDataType){let t=await this.mlContext.readTensor(this.mlTensor),r=Vr(new Uint8Array(t),this.dataType);if(e){(e instanceof ArrayBuffer?new Uint8Array(e):new Uint8Array(e.buffer,e.byteOffset,e.byteLength)).set(r);return}else return r.buffer}else return e?this.mlContext.readTensor(this.mlTensor,e):this.mlContext.readTensor(this.mlTensor)}canReuseTensor(e,t,r){return this.mlContext===e&&this.dataType===t&&this.tensorShape.length===r.length&&this.tensorShape.every((i,a)=>i===r[a])}setIsDataConverted(e){this.isDataConverted=e}},ci=class{constructor(e,t){this.tensorManager=e,this.wrapper=t}get tensorWrapper(){return this.wrapper}releaseTensor(){this.tensorWrapper&&(this.tensorManager.releaseTensor(this.tensorWrapper),this.wrapper=void 0)}async ensureTensor(e,t,r,i){let a=this.tensorManager.getMLContext(e),n;if(!a.opSupportLimits().input.dataTypes.includes(t)){if(n=Zt.get(t),!n||!a.opSupportLimits().input.dataTypes.includes(n))throw new Error(`WebNN backend does not support data type: ${t}`);Te("verbose",()=>`[WebNN] TensorIdTracker.ensureTensor: fallback dataType from ${t} to ${n}`)}if(this.wrapper){if(this.wrapper.canReuseTensor(a,t,r))return this.wrapper.tensor;if(i){if(this.wrapper.byteLength!==di(t,r))throw new Error("Unable to copy data to tensor with different size.");this.activeUpload=new Uint8Array(await this.wrapper.read())}this.tensorManager.releaseTensor(this.wrapper)}let s=typeof MLTensorUsage>"u"?void 0:MLTensorUsage.READ|MLTensorUsage.WRITE;return this.wrapper=await this.tensorManager.getCachedTensor(e,t,r,s,!0,!0,n),i&&this.activeUpload&&(this.wrapper.write(this.activeUpload),this.activeUpload=void 0),this.wrapper.tensor}upload(e){let t=e;if(this.wrapper){if(this.wrapper.fallbackType)if(this.wrapper.fallbackType==="int32")t=ur(e,this.wrapper.type),this.wrapper.setIsDataConverted(!0);else throw new Error(`Unsupported fallback data type: ${this.wrapper.fallbackType}`);if(e.byteLength===this.wrapper.byteLength){this.wrapper.write(t);return}else Te("verbose",()=>"Data size does not match tensor size. Releasing tensor."),this.releaseTensor()}this.activeUpload?this.activeUpload.set(t):this.activeUpload=new Uint8Array(t)}async download(e){var t,r;if(this.activeUpload){let i=(t=this.wrapper)!=null&&t.isDataConverted?Vr(this.activeUpload,(r=this.wrapper)==null?void 0:r.type):this.activeUpload;if(e){e instanceof ArrayBuffer?new Uint8Array(e).set(i):new Uint8Array(e.buffer,e.byteOffset,e.byteLength).set(i);return}else return i.buffer}if(!this.wrapper)throw new Error("Tensor has not been created.");return e?this.wrapper.read(e):this.wrapper.read()}},Ji=class{constructor(e){this.backend=e,this.tensorTrackersById=new Map,this.freeTensors=[],this.externalTensors=new Set}getMLContext(e){let t=this.backend.getMLContext(e);if(!t)throw new Error("MLContext not found for session.");return t}reserveTensorId(){let e=Dt();return this.tensorTrackersById.set(e,new ci(this)),e}releaseTensorId(e){let t=this.tensorTrackersById.get(e);t&&(this.tensorTrackersById.delete(e),t.tensorWrapper&&this.releaseTensor(t.tensorWrapper))}async ensureTensor(e,t,r,i,a){Te("verbose",()=>`[WebNN] TensorManager.ensureTensor {tensorId: ${t}, dataType: ${r}, shape: ${i}, copyOld: ${a}}`);let n=this.tensorTrackersById.get(t);if(!n)throw new Error("Tensor not found.");return n.ensureTensor(e,r,i,a)}upload(e,t){let r=this.tensorTrackersById.get(e);if(!r)throw new Error("Tensor not found.");r.upload(t)}async download(e,t){Te("verbose",()=>`[WebNN] TensorManager.download {tensorId: ${e}, dstBuffer: ${t==null?void 0:t.byteLength}}`);let r=this.tensorTrackersById.get(e);if(!r)throw new Error("Tensor not found.");return r.download(t)}releaseTensorsForSession(e){for(let t of this.freeTensors)t.sessionId===e&&t.destroy();this.freeTensors=this.freeTensors.filter(t=>t.sessionId!==e)}registerTensor(e,t,r,i){let a=this.getMLContext(e),n=Dt(),s=new pi({sessionId:e,context:a,tensor:t,dataType:r,shape:i});return this.tensorTrackersById.set(n,new ci(this,s)),this.externalTensors.add(s),n}async getCachedTensor(e,t,r,i,a,n,s){let o=this.getMLContext(e);for(let[l,d]of this.freeTensors.entries())if(d.canReuseTensor(o,t,r)){Te("verbose",()=>`[WebNN] Reusing tensor {dataType: ${t}, ${s?`fallbackDataType: ${s},`:""} shape: ${r}`);let p=this.freeTensors.splice(l,1)[0];return p.sessionId=e,p}Te("verbose",()=>`[WebNN] MLContext.createTensor {dataType: ${t}, ${s?`fallbackDataType: ${s},`:""} shape: ${r}}`);let u=await o.createTensor({dataType:s??t,shape:r,dimensions:r,usage:i,writable:a,readable:n});return new pi({sessionId:e,context:o,tensor:u,dataType:t,shape:r,fallbackDataType:s})}releaseTensor(e){this.externalTensors.has(e)&&this.externalTensors.delete(e),this.freeTensors.push(e)}},ea=(...e)=>new Ji(...e)}),lr,ta,ra,ia=I(()=>{pe(),_t(),or(),Ta(),Tt(),lr=new Map([[1,"float32"],[10,"float16"],[6,"int32"],[12,"uint32"],[7,"int64"],[13,"uint64"],[22,"int4"],[21,"uint4"],[3,"int8"],[2,"uint8"],[9,"uint8"]]),ta=(e,t)=>{if(e===t)return!0;if(e===void 0||t===void 0)return!1;let r=Object.keys(e).sort(),i=Object.keys(t).sort();return r.length===i.length&&r.every((a,n)=>a===i[n]&&e[a]===t[a])},ra=class{constructor(e){this.tensorManager=ea(this),this.mlContextBySessionId=new Map,this.sessionIdsByMLContext=new Map,this.mlContextCache=[],this.sessionGraphInputs=new Map,this.sessionGraphOutputs=new Map,this.temporaryGraphInputs=[],this.temporaryGraphOutputs=[],this.temporarySessionTensorIds=new Map,si(e.logLevel,!!e.debug)}get currentSessionId(){if(this.activeSessionId===void 0)throw new Error("No active session");return this.activeSessionId}onRunStart(e){Te("verbose",()=>`[WebNN] onRunStart {sessionId: ${e}}`),this.activeSessionId=e}onRunEnd(e){Te("verbose",()=>`[WebNN] onRunEnd {sessionId: ${e}}`);let t=this.temporarySessionTensorIds.get(e);if(t){for(let r of t)Te("verbose",()=>`[WebNN] releasing temporary tensor {tensorId: ${r}}`),this.tensorManager.releaseTensorId(r);this.temporarySessionTensorIds.delete(e),this.activeSessionId=void 0}}async createMLContext(e){if(e instanceof GPUDevice){let r=this.mlContextCache.findIndex(i=>i.gpuDevice===e);if(r!==-1)return this.mlContextCache[r].mlContext;{let i=await navigator.ml.createContext(e);return this.mlContextCache.push({gpuDevice:e,mlContext:i}),i}}else if(e===void 0){let r=this.mlContextCache.findIndex(i=>i.options===void 0&&i.gpuDevice===void 0);if(r!==-1)return this.mlContextCache[r].mlContext;{let i=await navigator.ml.createContext();return this.mlContextCache.push({mlContext:i}),i}}let t=this.mlContextCache.findIndex(r=>ta(r.options,e));if(t!==-1)return this.mlContextCache[t].mlContext;{let r=await navigator.ml.createContext(e);return this.mlContextCache.push({options:e,mlContext:r}),r}}registerMLContext(e,t){this.mlContextBySessionId.set(e,t);let r=this.sessionIdsByMLContext.get(t);r||(r=new Set,this.sessionIdsByMLContext.set(t,r)),r.add(e),this.temporaryGraphInputs.length>0&&(this.sessionGraphInputs.set(e,this.temporaryGraphInputs),this.temporaryGraphInputs=[]),this.temporaryGraphOutputs.length>0&&(this.sessionGraphOutputs.set(e,this.temporaryGraphOutputs),this.temporaryGraphOutputs=[])}onReleaseSession(e){this.sessionGraphInputs.delete(e),this.sessionGraphOutputs.delete(e);let t=this.mlContextBySessionId.get(e);if(!t)return;this.tensorManager.releaseTensorsForSession(e),this.mlContextBySessionId.delete(e);let r=this.sessionIdsByMLContext.get(t);if(r.delete(e),r.size===0){this.sessionIdsByMLContext.delete(t);let i=this.mlContextCache.findIndex(a=>a.mlContext===t);i!==-1&&this.mlContextCache.splice(i,1)}}getMLContext(e){return this.mlContextBySessionId.get(e)}reserveTensorId(){return this.tensorManager.reserveTensorId()}releaseTensorId(e){Te("verbose",()=>`[WebNN] releaseTensorId {tensorId: ${e}}`),this.tensorManager.releaseTensorId(e)}async ensureTensor(e,t,r,i,a){let n=lr.get(r);if(!n)throw new Error(`Unsupported ONNX data type: ${r}`);return this.tensorManager.ensureTensor(e??this.currentSessionId,t,n,i,a)}async createTemporaryTensor(e,t,r){Te("verbose",()=>`[WebNN] createTemporaryTensor {onnxDataType: ${t}, shape: ${r}}`);let i=lr.get(t);if(!i)throw new Error(`Unsupported ONNX data type: ${t}`);let a=this.tensorManager.reserveTensorId();await this.tensorManager.ensureTensor(e,a,i,r,!1);let n=this.temporarySessionTensorIds.get(e);return n?n.push(a):this.temporarySessionTensorIds.set(e,[a]),a}uploadTensor(e,t){if(!he().shouldTransferToMLTensor)throw new Error("Trying to upload to a MLTensor while shouldTransferToMLTensor is false");Te("verbose",()=>`[WebNN] uploadTensor {tensorId: ${e}, data: ${t.byteLength}}`),this.tensorManager.upload(e,t)}async downloadTensor(e,t){return this.tensorManager.download(e,t)}createMLTensorDownloader(e,t){return async()=>{let r=await this.tensorManager.download(e);return Kt(r,t)}}registerMLTensor(e,t,r,i){let a=lr.get(r);if(!a)throw new Error(`Unsupported ONNX data type: ${r}`);let n=this.tensorManager.registerTensor(e,t,a,i);return Te("verbose",()=>`[WebNN] registerMLTensor {tensor: ${t}, dataType: ${a}, dimensions: ${i}} -> {tensorId: ${n}}`),n}registerMLConstant(e,t,r,i,a,n,s=!1){if(!n)throw new Error("External mounted files are not available.");let o=e;e.startsWith("./")&&(o=e.substring(2));let u=n.get(o);if(!u)throw new Error(`File with name ${o} not found in preloaded files.`);if(t+r>u.byteLength)throw new Error("Out of bounds: data offset and length exceed the external file data size.");let l=u.slice(t,t+r).buffer,d;switch(a.dataType){case"float32":d=new Float32Array(l);break;case"float16":d=typeof Float16Array<"u"&&Float16Array.from?new Float16Array(l):new Uint16Array(l);break;case"int32":d=new Int32Array(l);break;case"uint32":d=new Uint32Array(l);break;case"int64":if(s){let p=ur(new Uint8Array(l),"int64");d=new Int32Array(p.buffer),a.dataType="int32"}else d=new BigInt64Array(l);break;case"uint64":d=new BigUint64Array(l);break;case"int8":d=new Int8Array(l);break;case"int4":case"uint4":case"uint8":d=new Uint8Array(l);break;default:throw new Error(`Unsupported data type: ${a.dataType} in creating WebNN Constant from external data.`)}return Te("verbose",()=>`[WebNN] registerMLConstant {dataType: ${a.dataType}, shape: ${a.shape}}} ${s?"(Note: it was int64 data type and registered to int32 as workaround)":""}`),i.constant(a,d)}registerGraphInput(e){this.temporaryGraphInputs.push(e)}registerGraphOutput(e){this.temporaryGraphOutputs.push(e)}isGraphInput(e,t){let r=this.sessionGraphInputs.get(e);return r?r.includes(t):!1}isGraphOutput(e,t){let r=this.sessionGraphOutputs.get(e);return r?r.includes(t):!1}isGraphInputOutputTypeSupported(e,t,r=!0){let i=this.mlContextBySessionId.get(e),a=lr.get(bt(t));return typeof a>"u"?!1:r?!!(i!=null&&i.opSupportLimits().input.dataTypes.includes(a)):!!(i!=null&&i.opSupportLimits().output.dataTypes.includes(a))}flush(){}}}),hi=I(()=>{}),fi,mi,Fr,gi,yi,wi,aa,na,Ea,un=I(()=>{Tt(),hi(),fi=new Map([[64,250],[128,200],[256,200],[512,200],[2048,230],[4096,200],[8192,50],[16384,50],[32768,50],[65536,50],[131072,50],[262144,50],[524288,50],[1048576,50],[2097152,30],[4194304,20],[8388608,10],[12582912,10],[16777216,10],[26214400,15],[33554432,22],[44236800,2],[58982400,6],[67108864,6],[134217728,6],[167772160,6]]),mi=[],Fr=e=>Math.ceil(Number(e)/16)*16,gi=e=>{for(let t=0;t<mi.length;t++){let r=mi[t];if(e<=r)return r}return Math.ceil(e/16)*16},yi=1,wi=()=>yi++,aa=async(e,t,r,i)=>{let a=Fr(r),n=e.device.createBuffer({size:a,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});try{let s=e.getCommandEncoder();e.endComputePass(),s.copyBufferToBuffer(t,0,n,0,a),e.flush(),await n.mapAsync(GPUMapMode.READ);let o=n.getMappedRange();if(i){let u=i();return u.set(new Uint8Array(o,0,r)),u}else return new Uint8Array(o.slice(0,r))}finally{n.destroy()}},na=class{constructor(e){this.backend=e,this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.buffersPending=[],this.capturedPendingBuffers=new Map;for(let[t]of fi)mi.push(t),this.freeBuffers.set(t,[]),this.freeUniformBuffers.set(t,[]);this.sessionCount=0}upload(e,t){let r=t.buffer,i=t.byteOffset,a=t.byteLength,n=Fr(a),s=this.storageCache.get(e);if(!s)throw new Error("gpu data for uploading does not exist");if(Number(s.originalSize)!==a)throw new Error(`inconsistent data size. gpu data size=${s.originalSize}, data size=${a}`);let o=this.backend.device.createBuffer({mappedAtCreation:!0,size:n,usage:GPUBufferUsage.MAP_WRITE|GPUBufferUsage.COPY_SRC}),u=o.getMappedRange();new Uint8Array(u).set(new Uint8Array(r,i,a)),o.unmap();let l=this.backend.device.createCommandEncoder();l.copyBufferToBuffer(o,0,s.gpuData.buffer,0,n),this.backend.device.queue.submit([l.finish()]),o.destroy(),Te("verbose",()=>`[WebGPU] GpuDataManager.upload(id=${e})`)}memcpy(e,t){let r=this.storageCache.get(e);if(!r)throw new Error("source gpu data for memcpy does not exist");let i=this.storageCache.get(t);if(!i)throw new Error("destination gpu data for memcpy does not exist");if(r.originalSize!==i.originalSize)throw new Error("inconsistent source and destination gpu data size");let a=Fr(r.originalSize),n=this.backend.getCommandEncoder();this.backend.endComputePass(),n.copyBufferToBuffer(r.gpuData.buffer,0,i.gpuData.buffer,0,a)}registerExternalBuffer(e,t,r){let i;if(r){if(i=r[0],e===r[1])return Te("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${i}, buffer is the same, skip.`),i;if(this.backend.capturedCommandList.has(this.backend.currentSessionId))throw new Error(`Registering a different external buffer under graph capture mode is not supported yet.
             Please use the previous external buffer!`)}else i=wi();return this.storageCache.set(i,{gpuData:{id:i,type:0,buffer:e},originalSize:t}),Te("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${i}, registered.`),i}unregisterExternalBuffer(e){e!==void 0&&(this.storageCache.delete(e),Te("verbose",()=>`[WebGPU] GpuDataManager.unregisterExternalBuffer() => id=${e}`))}create(e,t=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST){let r=gi(e),i,a=(t&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE,n=(t&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM;if(a||n){let o=(a?this.freeBuffers:this.freeUniformBuffers).get(r);o?o.length>0?i=o.pop():i=this.backend.device.createBuffer({size:r,usage:t}):i=this.backend.device.createBuffer({size:r,usage:t})}else i=this.backend.device.createBuffer({size:r,usage:t});let s={id:wi(),type:0,buffer:i};return this.storageCache.set(s.id,{gpuData:s,originalSize:Number(e)}),Te("verbose",()=>`[WebGPU] GpuDataManager.create(size=${e}) => id=${s.id}`),s}get(e){var t;return(t=this.storageCache.get(e))==null?void 0:t.gpuData}release(e){let t=typeof e=="bigint"?Number(e):e,r=this.storageCache.get(t);if(!r){if(this.storageCache.size===0)return 0;throw new Error("releasing data does not exist")}return Te("verbose",()=>`[WebGPU] GpuDataManager.release(id=${t}), gpuDataId=${r.gpuData.id}`),this.storageCache.delete(t),this.buffersPending.push(r.gpuData.buffer),r.originalSize}async download(e,t){let r=this.storageCache.get(Number(e));if(!r)throw new Error("data does not exist");await aa(this.backend,r.gpuData.buffer,r.originalSize,t)}refreshPendingBuffers(){if(this.buffersPending.length!==0)if(this.backend.sessionStatus==="default"){for(let e of this.buffersPending){let t=fi.get(e.size);if((e.usage&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE){let r=this.freeBuffers.get(e.size)||[];t===void 0||r.length>=t?e.destroy():r.push(e)}else if((e.usage&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM){let r=this.freeUniformBuffers.get(e.size)||[];t===void 0||r.length>=t?e.destroy():r.push(e)}else e.destroy()}this.buffersPending=[]}else{let e=this.capturedPendingBuffers.get(this.backend.currentSessionId);e||(e=[],this.capturedPendingBuffers.set(this.backend.currentSessionId,e));for(let t of this.buffersPending)e.push(t);this.buffersPending=[]}}dispose(){this.freeBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.freeUniformBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache.forEach(e=>{e.gpuData.buffer.destroy()}),this.capturedPendingBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.capturedPendingBuffers=new Map}onCreateSession(){this.sessionCount+=1}onReleaseSession(e){let t=this.capturedPendingBuffers.get(e);t&&(t.forEach(r=>{r.destroy()}),this.capturedPendingBuffers.delete(e)),this.sessionCount-=1,this.sessionCount===0&&(Te("warning",()=>"[WebGPU] Clearing webgpu buffer cache"),this.storageCache.forEach(r=>{r.gpuData.buffer.destroy()}),this.storageCache=new Map)}},Ea=(...e)=>new na(...e)}),c,g,b=I(()=>{c=class{constructor(e){Object.assign(this,e)}get cacheKey(){return this.key||(this.key=Object.getOwnPropertyNames(this).sort().map(e=>`${this[e]}`).join(";")),this.key}},g=e=>new c(e)}),T,v,A,k,E,O,L,F,q,P,J,z,H,Ue,_e,ge,Re,re=I(()=>{pe(),ae(),T=64,v=(e,t)=>{if(t===3)throw new Error("vec3 has same alignment as vec4, use vec4 instead");switch(Number(e)){case 10:return t>1?`vec${t}<f16>`:"f16";case 1:return t>1?`vec${t}<f32>`:"f32";case 6:return t>1?`vec${t}<i32>`:"i32";case 12:return t>1?`vec${t}<u32>`:"u32";case 7:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","i32"];case 13:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","u32"];case 9:if(t!==4)throw new Error("bool must be vec4");return["u32","vec4<bool>"];case 22:return"i32";case 21:return"u32";default:throw new Error(`Unknown data type: ${e}`)}},A=(e,t=1)=>{let r=v(e,t);return typeof r=="string"?r:r[0]},k=(e,t=1)=>{let r=v(e,t);return typeof r=="string"?r:r[1]},E=(...e)=>{let t=[];return e.forEach(r=>{r.length!==0&&t.push({type:12,data:r},{type:12,data:U.computeStrides(r)})}),t},O=e=>e%4===0?4:e%2===0?2:1,L=(e="f32",t,r="0")=>!t||t===1?`${e}(${r})`:`vec${t}<${e}>(${r})`,F=(e,t,r)=>e==="f32"?r:t===1?`f32(${r})`:`vec${t}<f32>(${r})`,q=(e,t)=>t===4?`(${e}.x + ${e}.y + ${e}.z + ${e}.w)`:t===2?`(${e}.x + ${e}.y)`:t===3?`(${e}.x + ${e}.y + ${e}.z)`:e,P=(e,t,r,i)=>e.startsWith("uniforms.")&&r>4?typeof t=="string"?i==="f16"?`${e}[(${t}) / 8][(${t}) % 8 / 4][(${t}) % 8 % 4]`:`${e}[(${t}) / 4][(${t}) % 4]`:i==="f16"?`${e}[${Math.floor(t/8)}][${Math.floor(t%8/4)}][${t%8%4}]`:`${e}[${Math.floor(t/4)}][${t%4}]`:r>1?`${e}[${t}]`:e,J=(e,t,r,i,a)=>{let n=typeof r=="number",s=n?r:r.length,o=[...new Array(s).keys()],u=s<2?"u32":s<=4?`vec${s}<u32>`:`array<u32, ${s}>`,l=v(t,a),d=typeof l=="string"?l:l[1],p=typeof l=="string"?l:l[0],h={indices:u,value:d,storage:p,tensor:t},f=W=>typeof W=="string"?W:`${W}u`,m={offsetToIndices:!1,indicesToOffset:!1,broadcastedIndicesToOffset:!1,set:!1,setByIndices:!1,get:!1,getByIndices:!1},y=n?"uniforms.":"",$=`${y}${e}_shape`,_=`${y}${e}_strides`,w="";for(let W=0;W<s-1;W++)w+=`
    let dim${W} = current / ${P(_,W,s)};
    let rest${W} = current % ${P(_,W,s)};
    indices[${W}] = dim${W};
    current = rest${W};
    `;w+=`indices[${s-1}] = current;`;let S=s<2?"":`
  fn o2i_${e}(offset: u32) -> ${h.indices} {
    var indices: ${h.indices};
    var current = offset;
    ${w}
    return indices;
  }`,x=W=>(m.offsetToIndices=!0,s<2?W:`o2i_${e}(${W})`),C=[];if(s>=2)for(let W=s-1;W>=0;W--)C.push(`${P(_,W,s)} * (indices[${W}])`);let D=s<2?"":`
  fn i2o_${e}(indices: ${h.indices}) -> u32 {
    return ${C.join("+")};
  }`,M=W=>(m.indicesToOffset=!0,s<2?W:`i2o_${e}(${W})`),N=(...W)=>s===0?"0u":`${h.indices}(${W.map(f).join(",")})`,V=(W,X)=>s<2?`${W}`:`${P(W,X,s)}`,Z=(W,X,se)=>s<2?`${W}=${se};`:`${P(W,X,s)}=${se};`,de={},ee=(W,X)=>{m.broadcastedIndicesToOffset=!0;let se=`${X.name}broadcastedIndicesTo${e}Offset`;if(se in de)return`${se}(${W})`;let xe=[];for(let kt=s-1;kt>=0;kt--){let $i=X.indicesGet("outputIndices",kt+X.rank-s);xe.push(`${V(_,kt)} * (${$i} % ${V($,kt)})`)}return de[se]=`fn ${se}(outputIndices: ${X.type.indices}) -> u32 {
             return ${xe.length>0?xe.join("+"):"0u"};
           }`,`${se}(${W})`},ue=(W,X)=>(()=>{if(h.storage===h.value)return`${e}[${W}]=${X};`;if(h.storage==="vec2<u32>"&&h.value==="i32")return`${e}[${W}]=vec2<u32>(u32(${X}), select(0u, 0xFFFFFFFFu, ${X} < 0));`;if(h.storage==="vec2<u32>"&&h.value==="u32")return`${e}[${W}]=vec2<u32>(u32(${X}), 0u);`;if(h.storage==="u32"&&h.value==="vec4<bool>")return`${e}[${W}]=dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(${X}));`;throw new Error(`not supported combination of storage type ${h.storage} and value type ${h.value} yet`)})(),ze=W=>(()=>{if(h.storage===h.value)return`${e}[${W}]`;if(h.storage==="vec2<u32>"&&h.value==="i32")return`i32(${e}[${W}].x)`;if(h.storage==="vec2<u32>"&&h.value==="u32")return`u32(${e}[${W}].x)`;if(h.storage==="u32"&&h.value==="vec4<bool>")return`vec4<bool>(bool(${e}[${W}] & 0xFFu), bool(${e}[${W}] & 0xFF00u), bool(${e}[${W}] & 0xFF0000u), bool(${e}[${W}] & 0xFF000000u))`;throw new Error(`not supported combination of storage type ${h.storage} and value type ${h.value} yet`)})(),be=s<2?"":`
  fn get_${e}ByIndices(indices: ${h.indices}) -> ${d} {
    return ${ze(`i2o_${e}(indices)`)};
  }`,ne=s<2?"":(()=>{let W=o.map(se=>`d${se}: u32`).join(", "),X=o.map(se=>`d${se}`).join(", ");return`
  fn get_${e}(${W}) -> ${d} {
    return get_${e}ByIndices(${N(X)});
  }`})(),ve=(...W)=>{if(W.length!==s)throw new Error(`indices length must be ${s}`);let X=W.map(f).join(",");return s===0?ze("0u"):s===1?ze(X[0]):(m.get=!0,m.getByIndices=!0,m.indicesToOffset=!0,`get_${e}(${X})`)},ie=W=>s<2?ze(W):(m.getByIndices=!0,m.indicesToOffset=!0,`get_${e}ByIndices(${W})`),fe=s<2?"":`
  fn set_${e}ByIndices(indices: ${h.indices}, value: ${d}) {
    ${ue(`i2o_${e}(indices)`,"value")}
  }`,st=s<2?"":(()=>{let W=o.map(se=>`d${se}: u32`).join(", "),X=o.map(se=>`d${se}`).join(", ");return`
  fn set_${e}(${W}, value: ${d}) {
    set_${e}ByIndices(${N(X)}, value);
  }`})();return{impl:()=>{let W=[],X=!1;return m.offsetToIndices&&(W.push(S),X=!0),m.indicesToOffset&&(W.push(D),X=!0),m.broadcastedIndicesToOffset&&(Object.values(de).forEach(se=>W.push(se)),X=!0),m.set&&(W.push(st),X=!0),m.setByIndices&&(W.push(fe),X=!0),m.get&&(W.push(ne),X=!0),m.getByIndices&&(W.push(be),X=!0),!n&&X&&W.unshift(`const ${$} = ${h.indices}(${r.join(",")});`,`const ${_} = ${h.indices}(${U.computeStrides(r).join(",")});`),W.join(`
`)},type:h,offsetToIndices:x,indicesToOffset:M,broadcastedIndicesToOffset:ee,indices:N,indicesGet:V,indicesSet:Z,set:(...W)=>{if(W.length!==s+1)throw new Error(`indices length must be ${s}`);let X=W[s];if(typeof X!="string")throw new Error("value must be string");let se=W.slice(0,s).map(f).join(",");return s===0?ue("0u",X):s===1?ue(se[0],X):(m.set=!0,m.setByIndices=!0,m.indicesToOffset=!0,`set_${e}(${se}, ${X})`)},setByOffset:ue,setByIndices:(W,X)=>s<2?ue(W,X):(m.setByIndices=!0,m.indicesToOffset=!0,`set_${e}ByIndices(${W}, ${X});`),get:ve,getByOffset:ze,getByIndices:ie,usage:i,name:e,strides:_,shape:$,rank:s}},z=(e,t,r,i=1)=>J(e,t,r,"input",i),H=(e,t,r,i=1)=>J(e,t,r,"output",i),Ue=(e,t,r)=>J(e,t,r,"atomicOutput",1),_e=(e,t,r,i=1)=>J(e,t,r,"internal",i),ge=class{constructor(e,t){this.normalizedDispatchGroup=e,this.limits=t,this.internalVariables=[],this.variables=[],this.uniforms=[],this.variableIndex=0}guardAgainstOutOfBoundsWorkgroupSizes(e){return`if (global_idx >= ${typeof e=="number"?`${e}u`:e}) { return; }`}mainStart(e=T){let t=typeof e=="number"?e:e[0],r=typeof e=="number"?1:e[1],i=typeof e=="number"?1:e[2];if(t>this.limits.maxComputeWorkgroupSizeX||r>this.limits.maxComputeWorkgroupSizeY||i>this.limits.maxComputeWorkgroupSizeZ)throw new Error(`workgroup size [${t}, ${r}, ${i}] exceeds the maximum workgroup size [${this.limits.maxComputeWorkgroupSizeX}, ${this.limits.maxComputeWorkgroupSizeY}, ${this.limits.maxComputeWorkgroupSizeZ}].`);if(t*r*i>this.limits.maxComputeInvocationsPerWorkgroup)throw new Error(`workgroup size [${t}, ${r}, ${i}] exceeds the maximum workgroup invocations ${this.limits.maxComputeInvocationsPerWorkgroup}.`);let a=this.normalizedDispatchGroup[1]===1&&this.normalizedDispatchGroup[2]===1,n=a?`@builtin(global_invocation_id) global_id : vec3<u32>,
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
`)}get variablesInfo(){if(this.uniforms.length===0)return;let e=t=>[12,10,1,6][["u32","f16","f32","i32"].indexOf(t)];return this.uniforms.map(t=>[e(t.type),t.length??1])}},Re=(e,t)=>new ge(e,t)}),De,Ce,et,rt,mt,qr,pt,sa,Et,it=I(()=>{pe(),ae(),b(),re(),De=(e,t)=>{if(!e||e.length!==1)throw new Error("Transpose requires 1 input.");if(t.length!==0&&t.length!==e[0].dims.length)throw new Error(`perm size ${t.length} does not match input rank ${e[0].dims.length}`)},Ce=(e,t)=>t.length!==0?t:[...new Array(e).keys()].reverse(),et=(e,t)=>U.sortBasedOnPerm(e,Ce(e.length,t)),rt=(e,t,r,i)=>{let a=`fn perm(i: ${i.type.indices}) -> ${r.type.indices} {
    var a: ${r.type.indices};`;for(let n=0;n<t;++n)a+=`a[${e[n]}]=i[${n}];`;return a+="return a;}"},mt=(e,t)=>{let r=[],i=[];for(let a=0;a<e.length;++a)e[a]!==1&&r.push(e[a]),e[t[a]]!==1&&i.push(t[a]);return{newShape:r,newPerm:i}},qr=(e,t)=>{let r=0;for(let i=0;i<e.length;++i)if(t[e[i]]!==1){if(e[i]<r)return!1;r=e[i]}return!0},pt=(e,t)=>{let r=e.dataType,i=e.dims.length,a=Ce(i,t),n=et(e.dims,a),s=e.dims,o=n,u=i<2||qr(a,e.dims),l;if(u)return l=m=>{let y=z("input",r,s,4),$=H("output",r,o,4);return`
  ${m.registerUniform("output_size","u32").declareVariables(y,$)}
  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    output[global_idx] = input[global_idx];
  }`},{name:"TransposeCopy",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let m=U.size(n);return{outputs:[{dims:n,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(m/64/4)},programUniforms:[{type:12,data:Math.ceil(m/4)}]}},getShaderSource:l};let{newShape:d,newPerm:p}=mt(e.dims,a),h=U.areEqual(p,[2,3,1]),f=U.areEqual(p,[3,1,2]);if(d.length===2||h||f){s=h?[d[0],d[1]*d[2]]:f?[d[0]*d[1],d[2]]:d,o=[s[1],s[0]];let m=16;return l=y=>{let $=z("a",r,s.length),_=H("output",r,o.length);return`
  ${y.registerUniform("output_size","u32").declareVariables($,_)}
  var<workgroup> tile : array<array<${_.type.value}, ${m+1}>, ${m}>;
  ${y.mainStart([m,m,1])}
    let stride = (uniforms.output_shape[1] - 1) / ${m} + 1;
    let workgroup_id_x = workgroup_index % stride;
    let workgroup_id_y = workgroup_index / stride;
    let input_col = workgroup_id_y * ${m}u + local_id.x;
    let input_row = workgroup_id_x * ${m}u + local_id.y;
    if (input_row < uniforms.a_shape[0] && input_col < uniforms.a_shape[1]) {
      tile[local_id.y][local_id.x] = ${$.getByIndices(`${$.type.indices}(input_row, input_col)`)};
    }
    workgroupBarrier();

    let output_col = workgroup_id_x * ${m}u + local_id.x;
    let output_row = workgroup_id_y * ${m}u + local_id.y;
    if (output_row < uniforms.output_shape[0] && output_col < uniforms.output_shape[1]) {
      ${_.setByIndices(`${_.type.indices}(output_row, output_col)`,"tile[local_id.x][local_id.y]")}
    }
  }`},{name:"TransposeShared",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let y=U.size(n);return{outputs:[{dims:n,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(o[1]/m),y:Math.ceil(o[0]/m)},programUniforms:[{type:12,data:y},...E(s,o)]}},getShaderSource:l}}return l=m=>{let y=z("a",r,s.length),$=H("output",r,o.length);return`
  ${m.registerUniform("output_size","u32").declareVariables(y,$)}

  ${rt(a,i,y,$)}

  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${$.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${$.setByOffset("global_idx",y.getByIndices("aIndices"))}
  }`},{name:"Transpose",shaderCache:{hint:`${t}`,inputDependencies:["rank"]},getRunData:()=>{let m=U.size(n);return{outputs:[{dims:n,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:[{type:12,data:m},...E(s,o)]}},getShaderSource:l}},sa=(e,t)=>{De(e.inputs,t.perm),e.compute(pt(e.inputs[0],t.perm))},Et=e=>g({perm:e.perm})}),oa,Ee,Pt,ka,Ut,Gr,je,ct,_i,jr,xt,Ia,Nt,Lt,dr,He,Ve,Ct,Ca,za,_s,bc=I(()=>{pe(),ae(),re(),dn(),it(),oa={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate * candidate",logSumExp:"bestValue + exp(candidate)",l1:"bestValue + abs(candidate)",l2:"bestValue + candidate * candidate",logSum:"bestValue + candidate"},Ee={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate",logSumExp:"bestValue + candidate",l1:"bestValue + candidate",l2:"bestValue + candidate",logSum:"bestValue + candidate"},Pt={max:"_A[offset]",min:"_A[offset]",mean:"0",sum:"0",prod:"1",sumSquare:"0",logSumExp:"0",l1:"0",l2:"0",logSum:"0"},ka={max:"bestValue",min:"bestValue",sum:"bestValue",prod:"bestValue",sumSquare:"bestValue",logSumExp:"log(bestValue)",l1:"bestValue",l2:"sqrt(bestValue)",logSum:"log(bestValue)"},Ut=(e,t)=>{let r=[];for(let i=t-e;i<t;++i)r.push(i);return r},Gr=(e,t)=>{let r=[],i=e.length;for(let n=0;n<i;n++)t.indexOf(n)===-1&&r.push(e[n]);let a=t.map(n=>e[n]);return[r,a]},je=(e,t)=>{let r=e.length+t.length,i=[],a=0;for(let n=0;n<r;n++)t.indexOf(n)===-1?i.push(e[a++]):i.push(1);return i},ct=(e,t)=>{for(let r=0;r<e.length;++r)if(e[e.length-r-1]!==t-1-r)return!1;return!0},_i=(e,t)=>{let r=[];if(!ct(e,t)){for(let i=0;i<t;++i)e.indexOf(i)===-1&&r.push(i);e.forEach(i=>r.push(i))}return r},jr=(e,t,r,i,a,n,s)=>{let o=r[0].dims,u=U.size(n),l=U.size(s),d=z("_A",r[0].dataType,o),p=H("output",a,n),h=64;u===1&&(h=256);let f=`
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

          var bestValue = f32(${Pt[i]});
          let Length = uniforms.reduceSize;
          for (var k = local_idx; k < Length; k = k + ${h}) {
           let candidate = f32(${d.getByOffset("offset + k")});
           bestValue = ${oa[i]};
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
          ${p.setByOffset("outputIndex",`${i==="mean"?`${p.type.storage}(bestValue / f32(uniforms.reduceSize))`:`${p.type.storage}(${ka[i]})`}`)};
         }
        }`;return{name:e,shaderCache:{hint:`${t};${h}`,inputDependencies:["type"]},getShaderSource:m,getRunData:()=>({outputs:[{dims:n,dataType:a}],dispatchGroup:{x:u},programUniforms:[{type:12,data:l}]})}},xt=(e,t,r,i)=>{let a=e.inputs.length===1?r:ln(e.inputs,r),n=a.axes;n.length===0&&!a.noopWithEmptyAxes&&(n=e.inputs[0].dims.map((f,m)=>m));let s=U.normalizeAxes(n,e.inputs[0].dims.length),o=s,u=e.inputs[0],l=_i(o,e.inputs[0].dims.length);l.length>0&&(u=e.compute(pt(e.inputs[0],l),{inputs:[0],outputs:[-1]})[0],o=Ut(o.length,u.dims.length));let[d,p]=Gr(u.dims,o),h=d;a.keepDims&&(h=je(d,s)),e.compute(jr(t,a.cacheKey,[u],i,e.inputs[0].dataType,h,p),{inputs:[u]})},Ia=(e,t)=>{xt(e,"ReduceMeanShared",t,"mean")},Nt=(e,t)=>{xt(e,"ReduceL1Shared",t,"l1")},Lt=(e,t)=>{xt(e,"ReduceL2Shared",t,"l2")},dr=(e,t)=>{xt(e,"ReduceLogSumExpShared",t,"logSumExp")},He=(e,t)=>{xt(e,"ReduceMaxShared",t,"max")},Ve=(e,t)=>{xt(e,"ReduceMinShared",t,"min")},Ct=(e,t)=>{xt(e,"ReduceProdShared",t,"prod")},Ca=(e,t)=>{xt(e,"ReduceSumShared",t,"sum")},za=(e,t)=>{xt(e,"ReduceSumSquareShared",t,"sumSquare")},_s=(e,t)=>{xt(e,"ReduceLogSumShared",t,"logSum")}}),Vt,bs,Aa,ln,Wt,$s,vs,xs,Ss,Ts,Es,ks,Is,Cs,zs,Ft,As,Os,Rs,Bs,Ms,Ds,Ps,Us,Ns,Ls,dn=I(()=>{pe(),ae(),b(),re(),bc(),Vt=e=>{if(!e||e.length===0||e.length>2)throw new Error("Reduce op requires 1 or 2 inputs.");if(e.length===2&&e[1].dims.length!==1)throw new Error("Invalid axes input dims.")},bs=e=>["","",`var value = ${e.getByIndices("input_indices")};`,""],Aa=(e,t,r,i,a,n,s=!1,o=!1)=>{let u=[],l=r[0].dims,d=l.length,p=U.normalizeAxes(a,d),h=!o&&p.length===0;l.forEach((y,$)=>{h||p.indexOf($)>=0?s&&u.push(1):u.push(y)});let f=u.length,m=U.size(u);return{name:e,shaderCache:t,getShaderSource:y=>{let $=[],_=z("_A",r[0].dataType,d),w=H("output",n,f),S=i(_,w,p),x=S[2];for(let C=0,D=0;C<d;C++)h||p.indexOf(C)>=0?(s&&D++,x=`for(var j${C}: u32 = 0; j${C} < ${l[C]}; j${C}++) {
                  ${S[2].includes("last_index")?`let last_index = j${C};`:""}
                  ${_.indicesSet("input_indices",C,`j${C}`)}
                  ${x}
                }`):($.push(`${_.indicesSet("input_indices",C,w.indicesGet("output_indices",D))};`),D++);return`

        ${y.registerUniform("output_size","u32").declareVariables(_,w)}

        ${y.mainStart()}
          ${y.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          var input_indices: ${_.type.indices};
          let output_indices = ${w.offsetToIndices("global_idx")};

          ${$.join(`
`)}
          ${S[0]}       // init ops for reduce max/min
          ${S[1]}
          ${x}
          ${S[3]}
          ${S.length===4?w.setByOffset("global_idx","value"):S.slice(4).join(`
`)}
        }`},getRunData:()=>({outputs:[{dims:u,dataType:n}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:[{type:12,data:m},...E(l,u)]})}},ln=(e,t)=>{let r=[];return e[1].dims[0]>0&&e[1].getBigInt64Array().forEach(i=>r.push(Number(i))),g({axes:r,keepDims:t.keepDims,noopWithEmptyAxes:t.noopWithEmptyAxes})},Wt=(e,t,r,i)=>{let a=e.inputs,n=a.length===1?r:ln(a,r);e.compute(Aa(t,{hint:n.cacheKey,inputDependencies:["rank"]},[a[0]],n.noopWithEmptyAxes&&n.axes.length===0?bs:i,n.axes,a[0].dataType,n.keepDims,n.noopWithEmptyAxes),{inputs:[0]})},$s=(e,t)=>{Vt(e.inputs),Wt(e,"ReduceLogSum",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += ${r.getByIndices("input_indices")};`,"value = log(value);"])},vs=(e,t)=>{Vt(e.inputs),Wt(e,"ReduceL1",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += abs(${r.getByIndices("input_indices")});`,""])},xs=(e,t)=>{Vt(e.inputs),Wt(e,"ReduceL2",t,(r,i)=>[`var t = ${i.type.value}(0); var value = ${i.type.value}(0);`,"",`t = ${r.getByIndices("input_indices")}; value += (t * t);`,"value = sqrt(value);"])},Ss=(e,t)=>{Vt(e.inputs),Wt(e,"ReduceLogSumExp",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += exp(${r.getByIndices("input_indices")});`,"value = log(value);"])},Ts=(e,t)=>{Vt(e.inputs),Wt(e,"ReduceMax",t,(r,i,a)=>{let n=[];for(let s=0;s<r.rank;s++)(a.indexOf(s)>=0||a.length===0)&&n.push(r.indicesSet("input_indices",s,0));return[`${n.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};`,`value = max(value, ${r.getByIndices("input_indices")});`,""]})},Es=(e,t)=>{Vt(e.inputs),Wt(e,"ReduceMean",t,(r,i,a)=>{let n=1;for(let s=0;s<r.rank;s++)(a.indexOf(s)>=0||a.length===0)&&(n*=e.inputs[0].dims[s]);return["var sum = f32(0);","",`sum += f32(${r.getByIndices("input_indices")});`,`let value = ${i.type.value}(sum / ${n});`]})},ks=(e,t)=>{Vt(e.inputs),Wt(e,"ReduceMin",t,(r,i,a)=>{let n=[];for(let s=0;s<r.rank;s++)(a.indexOf(s)>=0||a.length===0)&&n.push(`input_indices[${s}] = 0;`);return[`${n.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};`,`value = min(value, ${r.getByIndices("input_indices")});`,""]})},Is=(e,t)=>{Vt(e.inputs),Wt(e,"ReduceProd",t,(r,i)=>[`var value = ${i.type.storage}(1);`,"",`value *= ${r.getByIndices("input_indices")};`,""])},Cs=(e,t)=>{Vt(e.inputs),Wt(e,"ReduceSum",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += ${r.getByIndices("input_indices")};`,""])},zs=(e,t)=>{Vt(e.inputs),Wt(e,"ReduceSumSquare",t,(r,i)=>[`var t = ${i.type.value}(0); var value = ${i.type.value}(0);`,"",`t = ${r.getByIndices("input_indices")}; value += t * t;`,""])},Ft=(e,t,r)=>{if(t.length===0)return r;let i=1,a=1;for(let n=0;n<t.length;n++)t.indexOf(n)===-1?i*=e[n]:a*=e[n];return a<32&&i>1024},As=(e,t)=>{Ft(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Es(e,t):Ia(e,t)},Os=(e,t)=>{Ft(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?vs(e,t):Nt(e,t)},Rs=(e,t)=>{Ft(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?xs(e,t):Lt(e,t)},Bs=(e,t)=>{Ft(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Ss(e,t):dr(e,t)},Ms=(e,t)=>{Ft(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Ts(e,t):He(e,t)},Ds=(e,t)=>{Ft(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?ks(e,t):Ve(e,t)},Ps=(e,t)=>{Ft(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Is(e,t):Ct(e,t)},Us=(e,t)=>{Ft(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Cs(e,t):Ca(e,t)},Ns=(e,t)=>{Ft(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?zs(e,t):za(e,t)},Ls=(e,t)=>{Ft(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?$s(e,t):_s(e,t)}}),pn,Vs,Ws,cn,$c=I(()=>{pe(),b(),dn(),pn=e=>{if(!e||e.length===0||e.length>2)throw new Error("ArgMinMaxOp op requires 1 or 2 inputs.");if(e[0].dataType!==1)throw new Error("Invalid input type.")},Vs=(e,t)=>{pn(e.inputs);let r=(i,a,n)=>{let s=[];for(let o=0;o<i.rank;o++)(n.indexOf(o)>=0||n.length===0)&&s.push(`input_indices[${o}] = 0;`);return[`${s.join(`
`)}`,`var value = ${i.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${i.getByIndices("input_indices")} ${t.selectLastIndex>0?"<=":"<"} value) {
         value = ${i.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",a.setByOffset("global_idx","best_index")]};e.compute(Aa("ArgMin",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],r,[t.axis],7,t.keepDims),{inputs:[0]})},Ws=(e,t)=>{pn(e.inputs);let r=(i,a,n)=>{let s=[];for(let o=0;o<i.rank;o++)(n.indexOf(o)>=0||n.length===0)&&s.push(`input_indices[${o}] = 0;`);return[`${s.join(`
`)}`,`var value = ${i.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${i.getByIndices("input_indices")} ${t.selectLastIndex>0?">=":">"} value) {
         value = ${i.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",a.setByOffset("global_idx","best_index")]};e.compute(Aa("argMax",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],r,[t.axis],7,t.keepDims),{inputs:[0]})},cn=e=>g(e)}),Fs,Oa,qs,Gs,js,ua,Hs,Ks,hn=I(()=>{pe(),ae(),hi(),re(),Fs=(e,t)=>{let r=e[0],i=e[1],a=e[2],n=e[3],s=e[4],o=e[5];if(s&&o)throw new Error("Attention cannot have both past and attention_bias");if(r.dims.length!==3)throw new Error('Input "input" must have 3 dimensions');let u=r.dims[0],l=r.dims[1],d=r.dims[2];if(a.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimensions');if(i.dims.length!==2)throw new Error('Input "weights" is expected to have 2 dimensions');if(i.dims[0]!==d)throw new Error("Input 1 dimension 0 should have same length as dimension 2 of input 0");if(a.dims[0]!==i.dims[1])throw new Error('Input "bias" dimension 0 should have same length as dimension 1 of input "weights"');let p=a.dims[0]/3,h=p,f=h;if(t.qkvHiddenSizes.length>0){if(t.qkvHiddenSizes.length!==3)throw new Error("qkv_hidden_sizes attribute should have 3 elements");for(let S of t.qkvHiddenSizes)if(S%t.numHeads!==0)throw new Error("qkv_hidden_sizes should be divisible by num_heads");p=t.qkvHiddenSizes[0],h=t.qkvHiddenSizes[1],f=t.qkvHiddenSizes[2]}let m=l;if(p!==h)throw new Error("qkv_hidden_sizes first element should be same as the second");if(a.dims[0]!==p+h+f)throw new Error('Input "bias" dimension 0 should have same length as sum of Q/K/V hidden sizes');let y=0;if(s){if(h!==f)throw new Error('Input "past" expect k_hidden_size == v_hidden_size');if(s.dims.length!==5)throw new Error('Input "past" must have 5 dimensions');if(s.dims[0]!==2)throw new Error('Input "past" first dimension must be 2');if(s.dims[1]!==u)throw new Error('Input "past" second dimension must be batch_size');if(s.dims[2]!==t.numHeads)throw new Error('Input "past" third dimension must be num_heads');if(s.dims[4]!==h/t.numHeads)throw new Error('Input "past" fifth dimension must be k_hidden_size / num_heads');t.pastPresentShareBuffer||(y=s.dims[3])}let $=m+y,_=-1,w=0;if(n)throw new Error("Mask not supported");if(s)throw new Error("past is not supported");if(o){if(o.dims.length!==4)throw new Error('Input "attention_bias" must have 4 dimensions');if(o.dims[0]!==u||o.dims[1]!==t.numHeads||o.dims[2]!==l||o.dims[3]!==$)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:u,sequenceLength:l,pastSequenceLength:y,kvSequenceLength:m,totalSequenceLength:$,maxSequenceLength:_,inputHiddenSize:d,hiddenSize:p,vHiddenSize:f,headSize:Math.floor(p/t.numHeads),vHeadSize:Math.floor(f/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:w,scale:t.scale,broadcastResPosBias:!1,passPastInKv:!1,qkvFormat:1}},Oa=(e,t,r)=>t&&e?`
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
    `,qs=(e,t,r,i,a,n,s,o)=>{let u=O(s?1:n),l=64,d=n/u;d<l&&(l=32);let p=Math.ceil(n/u/l),h=[{type:12,data:t},{type:12,data:r},{type:12,data:i},{type:12,data:a},{type:12,data:d},{type:12,data:p}],f=A(e.dataType,u),m=k(1,u),y=["type"];s&&y.push("type"),o&&y.push("type");let $=_=>{let w=H("x",e.dataType,e.dims,u),S=[w],x=s?z("seq_lens",s.dataType,s.dims):void 0;x&&S.push(x);let C=o?z("total_sequence_length_input",o.dataType,o.dims):void 0;C&&S.push(C);let D=k(e.dataType),M=[{name:"batch_size",type:"u32"},{name:"num_heads",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"sequence_length",type:"u32"},{name:"total_sequence_length",type:"u32"},{name:"elements_per_thread",type:"u32"}];return`
  var<workgroup> thread_max: array<f32, ${l}>;
  var<workgroup> thread_sum: array<f32, ${l}>;
  ${_.registerUniforms(M).declareVariables(...S)}
  ${_.mainStart([l,1,1])}
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let sequence_length = uniforms.sequence_length;
    var total_sequence_length = uniforms.total_sequence_length;
    ${Oa(x,C,!1)}
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
  }`};return{name:"AttentionProbsSoftmax",shaderCache:{hint:`${l};${f};${u}`,inputDependencies:y},getShaderSource:$,getRunData:()=>({outputs:[],dispatchGroup:{x:1,y:a,z:t*r},programUniforms:h})}},Gs=(e,t,r,i,a,n,s,o,u)=>{let l=s+n.kvSequenceLength,d=[n.batchSize,n.numHeads,n.sequenceLength,l],p=e>1&&i,h=n.kvNumHeads?n.kvNumHeads:n.numHeads,f=p?[n.batchSize,h,l,n.headSize]:void 0,m=n.nReps?n.nReps:1,y=n.scale===0?1/Math.sqrt(n.headSize):n.scale,$=O(n.headSize),_=n.headSize/$,w=12,S={x:Math.ceil(l/w),y:Math.ceil(n.sequenceLength/w),z:n.batchSize*n.numHeads},x=[{type:12,data:n.sequenceLength},{type:12,data:_},{type:12,data:l},{type:12,data:n.numHeads},{type:12,data:n.headSize},{type:1,data:y},{type:12,data:s},{type:12,data:n.kvSequenceLength},{type:12,data:m}],C=p&&i&&U.size(i.dims)>0,D=["type","type"];C&&D.push("type"),a&&D.push("type"),o&&D.push("type"),u&&D.push("type");let M=[{dims:d,dataType:t.dataType,gpuDataType:0}];p&&M.push({dims:f,dataType:t.dataType,gpuDataType:0});let N=V=>{let Z=z("q",t.dataType,t.dims,$),de=z("key",r.dataType,r.dims,$),ee=[Z,de];if(C){let fe=z("past_key",i.dataType,i.dims,$);ee.push(fe)}a&&ee.push(z("attention_bias",a.dataType,a.dims));let ue=o?z("seq_lens",o.dataType,o.dims):void 0;ue&&ee.push(ue);let ze=u?z("total_sequence_length_input",u.dataType,u.dims):void 0;ze&&ee.push(ze);let be=H("output",t.dataType,d),ne=[be];p&&ne.push(H("present_key",t.dataType,f,$));let ve=k(1,$),ie=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"alpha",type:"f32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${w}u;

  var<workgroup> tileQ: array<${Z.type.storage}, ${w*w}>;
  var<workgroup> tileK: array<${Z.type.storage}, ${w*w}>;
  ${V.registerUniforms(ie).declareVariables(...ee,...ne)}
  ${V.mainStart([w,w,1])}
    // x holds the N and y holds the M
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let kvHeadIdx = ${m===1?"headIdx":"headIdx / uniforms.n_reps"};
    let kv_num_heads = ${m===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let m = workgroup_id.y * TILE_SIZE;
    let n = workgroup_id.x * TILE_SIZE;
    let sequence_length = uniforms.M;
    var total_sequence_length = uniforms.N;
    ${Oa(ue,ze,!0)}
    let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx;
    let qOffset = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
    ${C&&p?"let pastKeyOffset = absKvHeadIdx * uniforms.past_sequence_length * uniforms.K;":""};
    let kOffset = absKvHeadIdx * uniforms.kv_sequence_length * uniforms.K;
    ${p?"let presentKeyOffset = absKvHeadIdx * uniforms.N * uniforms.K;":""}
    var value = ${ve}(0);
    for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (global_id.y < uniforms.M && w + local_id.x < uniforms.K) {
        tileQ[TILE_SIZE * local_id.y + local_id.x] = q[qOffset + local_id.y * uniforms.K + w + local_id.x];
      }
      if (n + local_id.y < uniforms.N && w + local_id.x < uniforms.K) {
        var idx = TILE_SIZE * local_id.y + local_id.x;
      ${C&&p?`
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
          value += ${ve}(tileQ[TILE_SIZE * local_id.y + k] * tileK[TILE_SIZE * local_id.x + k]);
      }

      workgroupBarrier();
    }

    if (global_id.y < uniforms.M && global_id.x < total_sequence_length) {
      let headOffset = workgroup_id.z * uniforms.M * uniforms.N;
      let outputIdx = headOffset + global_id.y * uniforms.N + global_id.x;
      var sum: f32 = ${(()=>{switch($){case 1:return"value";case 2:return"value.x + value.y";case 4:return"value.x + value.y + value.z + value.w";default:throw new Error(`Unsupported components: ${$}`)}})()};
        output[outputIdx] = ${be.type.value} (sum * uniforms.alpha) + ${a?"attention_bias[outputIdx]":"0.0"};
    }
  }`};return{name:"AttentionProbs",shaderCache:{hint:`${$};${a!==void 0};${i!==void 0};${e}`,inputDependencies:D},getRunData:()=>({outputs:M,dispatchGroup:S,programUniforms:x}),getShaderSource:N}},js=(e,t,r,i,a,n,s=void 0,o=void 0)=>{let u=n+a.kvSequenceLength,l=a.nReps?a.nReps:1,d=a.vHiddenSize*l,p=e>1&&i,h=a.kvNumHeads?a.kvNumHeads:a.numHeads,f=p?[a.batchSize,h,u,a.headSize]:void 0,m=[a.batchSize,a.sequenceLength,d],y=12,$={x:Math.ceil(a.vHeadSize/y),y:Math.ceil(a.sequenceLength/y),z:a.batchSize*a.numHeads},_=[{type:12,data:a.sequenceLength},{type:12,data:u},{type:12,data:a.vHeadSize},{type:12,data:a.numHeads},{type:12,data:a.headSize},{type:12,data:d},{type:12,data:n},{type:12,data:a.kvSequenceLength},{type:12,data:l}],w=p&&i&&U.size(i.dims)>0,S=["type","type"];w&&S.push("type"),s&&S.push("type"),o&&S.push("type");let x=[{dims:m,dataType:t.dataType,gpuDataType:0}];p&&x.push({dims:f,dataType:t.dataType,gpuDataType:0});let C=D=>{let M=z("probs",t.dataType,t.dims),N=z("v",r.dataType,r.dims),V=[M,N];w&&V.push(z("past_value",i.dataType,i.dims));let Z=s?z("seq_lens",s.dataType,s.dims):void 0;s&&V.push(Z);let de=o?z("total_sequence_length_input",o.dataType,o.dims):void 0;o&&V.push(de);let ee=[H("output",t.dataType,m)];p&&ee.push(H("present_value",t.dataType,f));let ue=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"v_hidden_size",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${y}u;
  var<workgroup> tileQ: array<${M.type.value}, ${y*y}>;
  var<workgroup> tileV: array<${M.type.value}, ${y*y}>;
  ${D.registerUniforms(ue).declareVariables(...V,...ee)}
  ${D.mainStart([y,y,1])}
   let headIdx = workgroup_id.z % uniforms.num_heads;
   let batchIdx = workgroup_id.z / uniforms.num_heads;
   let kvHeadIdx = ${l===1?"headIdx":"headIdx / uniforms.n_reps"};
   let kv_num_heads = ${l===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
   let m = global_id.y;
   let n = global_id.x;
   let sequence_length = uniforms.M;
   var total_sequence_length = uniforms.K;
   ${Oa(Z,de,!0)}
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
  }`};return{name:"AttentionScore",shaderCache:{hint:`${i!==void 0};${e}`,inputDependencies:S},getRunData:()=>({outputs:x,dispatchGroup:$,programUniforms:_}),getShaderSource:C}},ua=(e,t,r,i,a,n,s,o,u,l,d=void 0,p=void 0)=>{let h=Math.min(e.outputCount,1+(s?1:0)+(o?1:0)),f=h>1?l.pastSequenceLength:0,m=f+l.kvSequenceLength,y=u&&U.size(u.dims)>0?u:void 0,$=[t,r];h>1&&s&&U.size(s.dims)>0&&$.push(s),y&&$.push(y),d&&$.push(d),p&&$.push(p);let _=e.compute(Gs(h,t,r,s,y,l,f,d,p),{inputs:$,outputs:h>1?[-1,1]:[-1]})[0];e.compute(qs(_,l.batchSize,l.numHeads,f,l.sequenceLength,m,d,p),{inputs:d&&p?[_,d,p]:[_],outputs:[]});let w=[_,i];h>1&&o&&U.size(o.dims)>0&&w.push(o),d&&w.push(d),p&&w.push(p),e.compute(js(h,_,i,o,l,f,d,p),{inputs:w,outputs:h>1?[0,2]:[0]})},Hs=(e,t)=>{let r=[t.batchSize,t.numHeads,t.sequenceLength,t.headSize],i=t.sequenceLength,a=t.inputHiddenSize,n=t.headSize,s=12,o={x:Math.ceil(t.headSize/s),y:Math.ceil(t.sequenceLength/s),z:t.batchSize*t.numHeads},u=[e.inputs[0],e.inputs[1],e.inputs[2]],l=[{type:12,data:i},{type:12,data:a},{type:12,data:n},{type:12,data:t.numHeads},{type:12,data:t.headSize},{type:12,data:t.hiddenSize},{type:12,data:t.hiddenSize+t.hiddenSize+t.vHiddenSize}],d=p=>{let h=H("output_q",u[0].dataType,r),f=H("output_k",u[0].dataType,r),m=H("output_v",u[0].dataType,r),y=z("input",u[0].dataType,u[0].dims),$=z("weight",u[1].dataType,u[1].dims),_=z("bias",u[2].dataType,u[2].dims),w=y.type.storage,S=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"hidden_size",type:"u32"},{name:"ldb",type:"u32"}];return`
  const TILE_SIZE = ${s}u;
  var<workgroup> tileInput: array<${w}, ${s*s}>;
  var<workgroup> tileWeightQ: array<${w}, ${s*s}>;
  var<workgroup> tileWeightK: array<${w}, ${s*s}>;
  var<workgroup> tileWeightV: array<${w}, ${s*s}>;
  ${p.registerUniforms(S).declareVariables(y,$,_,h,f,m)}
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
  }`};return e.compute({name:"AttentionPrepare",shaderCache:{inputDependencies:["type","type","type"]},getRunData:()=>({outputs:[{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0}],dispatchGroup:o,programUniforms:l}),getShaderSource:d},{inputs:u,outputs:[-1,-1,-1]})},Ks=(e,t)=>{let r=Fs(e.inputs,t),[i,a,n]=Hs(e,r);return ua(e,i,a,n,e.inputs[4],void 0,void 0,void 0,e.inputs[5],r)}}),Zs,Qs,Xs,Ys,vc=I(()=>{Qe(),pe(),ae(),b(),re(),Zs=(e,t)=>{if(!e||e.length!==5)throw new Error("BatchNormalization requires 5 inputs");let r=(i,a,n)=>{let s=a.length;if(s!==i.length)throw new Error(`${n}: num dimensions != ${s}`);a.forEach((o,u)=>{if(o!==i[u])throw new Error(`${n}: dim[${u}] do not match`)})};if(e[0].dims.length>1){let i=t.format==="NHWC"?t.spatial?e[0].dims.slice(-1):e[0].dims.slice(-1).concat(e[0].dims.slice(1,e[0].dims.length-1)):e[0].dims.slice(1,t.spatial?2:void 0);r(e[1].dims,i,"Invalid input scale"),r(e[2].dims,i,"Invalid input B"),r(e[3].dims,i,"Invalid input mean"),r(e[4].dims,i,"Invalid input var")}else r(e[1].dims,[1],"Invalid input scale"),r(e[2].dims,[1],"Invalid input B"),r(e[3].dims,[1],"Invalid input mean"),r(e[4].dims,[1],"Invalid input var")},Qs=(e,t)=>{let{epsilon:r,spatial:i,format:a}=t,n=e[0].dims,s=i?O(n[n.length-1]):1,o=a==="NHWC"&&n.length>1?s:1,u=U.size(n)/s,l=i,d=l?n.length:n,p=z("x",e[0].dataType,e[0].dims,s),h=z("scale",e[1].dataType,e[1].dims,o),f=z("bias",e[2].dataType,e[2].dims,o),m=z("inputMean",e[3].dataType,e[3].dims,o),y=z("inputVar",e[4].dataType,e[4].dims,o),$=H("y",e[0].dataType,d,s),_=()=>{let S="";if(i)S=`let cOffset = ${n.length===1?"0u":a==="NHWC"?`outputIndices[${n.length-1}] / ${s}`:"outputIndices[1]"};`;else if(a==="NCHW")S=`
            ${$.indicesSet("outputIndices","0","0")}
            let cOffset = ${$.indicesToOffset("outputIndices")};`;else{S=`var cIndices = ${h.type.indices}(0);
                       cIndices[0] = outputIndices[${n.length-1}];`;for(let x=1;x<h.rank;x++)S+=`cIndices[${x}] = outputIndices[${x}];`;S+=`let cOffset = ${h.indicesToOffset("cIndices")};`}return S},w=S=>`
  const epsilon = ${r};
  ${S.registerUniform("outputSize","u32").declareVariables(p,h,f,m,y,$)}
  ${S.mainStart()}
  ${S.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
    var outputIndices = ${$.offsetToIndices(`global_idx * ${s}`)};
    ${_()}
    let scale = ${h.getByOffset("cOffset")};
    let bias = ${f.getByOffset("cOffset")};
    let inputMean = ${m.getByOffset("cOffset")};
    let inputVar = ${y.getByOffset("cOffset")};
    let x = ${p.getByOffset("global_idx")};
    let value = (x - inputMean) * inverseSqrt(inputVar + epsilon) * scale + bias;
    ${$.setByOffset("global_idx","value")}
  }`;return{name:"BatchNormalization",shaderCache:{hint:`${t.epsilon}_${t.format}_${i}_${s}`,inputDependencies:l?["rank","type","type","type","type"]:void 0},getShaderSource:w,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:l?[{type:12,data:u},...E(n)]:[{type:12,data:u}]})}},Xs=e=>g(e),Ys=(e,t)=>{let{inputs:r,outputCount:i}=e,a=Xs({...t,outputCount:i});if(te.webgpu.validateInputContent&&Zs(r,a),t.trainingMode)throw new Error("BatchNormalization trainingMode is not supported yet.");e.compute(Qs(r,a))}}),Js,eo,to,xc=I(()=>{ae(),re(),Js=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![320,640,1280].includes(e[0].dims[2]))throw new Error("number of channels should be 320, 640 or 1280");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},eo=e=>{let t=e[0].dims,r=e[0].dims[2],i=U.size(t)/4,a=e[0].dataType,n=z("input",a,t,4),s=z("bias",a,[r],4),o=z("residual",a,t,4),u=H("output",a,t,4);return{name:"BiasAdd",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(i/64)}}),getShaderSource:l=>`
  const channels = ${r}u / 4;
  ${l.declareVariables(n,s,o,u)}

  ${l.mainStart()}
    ${l.guardAgainstOutOfBoundsWorkgroupSizes(i)}
    let value = ${n.getByOffset("global_idx")}
      + ${s.getByOffset("global_idx % channels")} + ${o.getByOffset("global_idx")};
    ${u.setByOffset("global_idx","value")}
  }`}},to=e=>{Js(e.inputs),e.compute(eo(e.inputs))}}),ro,Ae,io,ao,no,so,oo,uo,lo,po,co,ho,fo,mo,go,yo,la,wo,Ra,_o,bo,$o,vo,xo,So,To,Eo,ko,Io,Co,zo,Ao,Oo,Ro,Bo,fn,Mo,mn,gn,Do,Po,Uo,No,Lo,Vo,yn=I(()=>{pe(),ae(),b(),re(),ro=(e,t,r,i,a,n,s)=>{let o=Math.ceil(t/4),u="";typeof a=="string"?u=`${a}(a)`:u=a("a");let l=z("inputData",r,[o],4),d=H("outputData",i,[o],4),p=[{name:"vec_size",type:"u32"}];return s&&p.push(...s),`
      ${e.registerUniforms(p).declareVariables(l,d)}

  ${n??""}

  ${e.mainStart()}
    ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}

    let a = ${l.getByOffset("global_idx")};
    ${d.setByOffset("global_idx",u)}
  }`},Ae=(e,t,r,i,a,n=e.dataType,s,o)=>{let u=[{type:12,data:Math.ceil(U.size(e.dims)/4)}];return s&&u.push(...s),{name:t,shaderCache:{hint:a,inputDependencies:["type"]},getShaderSource:l=>ro(l,U.size(e.dims),e.dataType,n,r,i,o),getRunData:l=>({outputs:[{dims:e.dims,dataType:n}],dispatchGroup:{x:Math.ceil(U.size(l[0].dims)/64/4)},programUniforms:u})}},io=e=>{e.compute(Ae(e.inputs[0],"Abs","abs"))},ao=e=>{e.compute(Ae(e.inputs[0],"Acos","acos"))},no=e=>{e.compute(Ae(e.inputs[0],"Acosh","acosh"))},so=e=>{e.compute(Ae(e.inputs[0],"Asin","asin"))},oo=e=>{e.compute(Ae(e.inputs[0],"Asinh","asinh"))},uo=e=>{e.compute(Ae(e.inputs[0],"Atan","atan"))},lo=e=>{e.compute(Ae(e.inputs[0],"Atanh","atanh"))},po=e=>g(e),co=(e,t)=>{let r;switch(t.to){case 10:r="vec4<f16>";break;case 1:r="vec4<f32>";break;case 12:r="vec4<u32>";break;case 6:r="vec4<i32>";break;case 9:r="vec4<bool>";break;default:throw new RangeError(`not supported type (specified in attribute 'to' from 'Cast' operator): ${t.to}`)}e.compute(Ae(e.inputs[0],"Cast",r,void 0,t.cacheKey,t.to))},ho=e=>{let t,r,i=e.length>=2&&e[1].data!==0,a=e.length>=3&&e[2].data!==0;switch(e[0].dataType){case 1:t=i?e[1].getFloat32Array()[0]:-34028234663852886e22,r=a?e[2].getFloat32Array()[0]:34028234663852886e22;break;case 10:t=i?e[1].getUint16Array()[0]:64511,r=a?e[2].getUint16Array()[0]:31743;break;default:throw new Error("Unsupport data type")}return g({min:t,max:r})},fo=(e,t)=>{let r=t||ho(e.inputs),i=k(e.inputs[0].dataType);e.compute(Ae(e.inputs[0],"Clip",a=>`clamp(${a}, vec4<${i}>(uniforms.min), vec4<${i}>(uniforms.max))`,void 0,r.cacheKey,void 0,[{type:e.inputs[0].dataType,data:r.min},{type:e.inputs[0].dataType,data:r.max}],[{name:"min",type:i},{name:"max",type:i}]),{inputs:[0]})},mo=e=>{e.compute(Ae(e.inputs[0],"Ceil","ceil"))},go=e=>{e.compute(Ae(e.inputs[0],"Cos","cos"))},yo=e=>{e.compute(Ae(e.inputs[0],"Cosh","cosh"))},la=e=>g(e),wo=(e,t)=>{let r=k(e.inputs[0].dataType);e.compute(Ae(e.inputs[0],"Elu",i=>`elu_vf32(${i})`,`
  const elu_alpha_ = ${r}(${t.alpha});

  fn elu_f32(a: ${r}) -> ${r} {
  return select((exp(a) - 1.0) * elu_alpha_, a, a >= 0.0);
  }

  fn elu_vf32(v: vec4<${r}>) -> vec4<${r}> {
  return vec4(elu_f32(v.x), elu_f32(v.y), elu_f32(v.z), elu_f32(v.w));
  }`,t.cacheKey))},Ra=(e="f32")=>`
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
}`,_o=e=>{let t=k(e.inputs[0].dataType);e.compute(Ae(e.inputs[0],"Erf",r=>`erf_vf32(${r})`,Ra(t)))},bo=e=>{e.compute(Ae(e.inputs[0],"Exp","exp"))},$o=e=>{e.compute(Ae(e.inputs[0],"Floor","floor"))},vo=e=>{let t=k(e.inputs[0].dataType);e.compute(Ae(e.inputs[0],"Gelu",r=>`0.5 * ${r} * (1.0 + erf_vf32(${r} * 0.7071067811865475))`,Ra(t)))},xo=(e,t)=>{let r=k(e.inputs[0].dataType);e.compute(Ae(e.inputs[0],"LeakyRelu",i=>`select(leaky_relu_alpha_ * ${i}, ${i}, ${i} >= vec4<${r}>(0.0))`,`const leaky_relu_alpha_ = ${r}(${t.alpha});`,t.cacheKey))},So=e=>{e.compute(Ae(e.inputs[0],"Not",t=>`!${t}`))},To=e=>{e.compute(Ae(e.inputs[0],"Neg",t=>`-${t}`))},Eo=e=>{e.compute(Ae(e.inputs[0],"Reciprocal",t=>`1.0/${t}`))},ko=e=>{let t=k(e.inputs[0].dataType);e.compute(Ae(e.inputs[0],"Relu",r=>`select(vec4<${t}>(0.0), ${r}, ${r} > vec4<${t}>(0.0))`))},Io=e=>{e.compute(Ae(e.inputs[0],"Sigmoid",t=>`(1.0 / (1.0 + exp(-${t})))`))},Co=e=>g(e),zo=(e,t)=>{let r=k(e.inputs[0].dataType);e.compute(Ae(e.inputs[0],"HardSigmoid",i=>`max(vec4<${r}>(0.0), min(vec4<${r}>(1.0), ${t.alpha} * ${i} + vec4<${r}>(${t.beta})))`,void 0,t.cacheKey))},Ao=e=>{e.compute(Ae(e.inputs[0],"Sin","sin"))},Oo=e=>{e.compute(Ae(e.inputs[0],"Sinh","sinh"))},Ro=e=>{e.compute(Ae(e.inputs[0],"Sqrt","sqrt"))},Bo=e=>{e.compute(Ae(e.inputs[0],"Tan","tan"))},fn=e=>`sign(${e}) * (1 - exp(-2 * abs(${e}))) / (1 + exp(-2 * abs(${e})))`,Mo=e=>{e.compute(Ae(e.inputs[0],"Tanh",fn))},mn=(e="f32")=>`
const fast_gelu_a: ${e} = 0.5;
const fast_gelu_b: ${e} = 0.7978845608028654;
const fast_gelu_c: ${e} = 0.035677408136300125;

fn tanh_v(v: vec4<${e}>) -> vec4<${e}> {
  return ${fn("v")};
}
`,gn=e=>`(fast_gelu_a + fast_gelu_a * tanh_v(${e} * (fast_gelu_c * ${e} * ${e} + fast_gelu_b))) * ${e}`,Do=e=>{let t=k(e.inputs[0].dataType);e.compute(Ae(e.inputs[0],"FastGelu",gn,mn(t),void 0,e.inputs[0].dataType))},Po=(e,t)=>{let r=k(e.inputs[0].dataType);return e.compute(Ae(e.inputs[0],"ThresholdedRelu",i=>`select(vec4<${r}>(0.0), ${i}, ${i} > thresholded_relu_alpha_)`,`const thresholded_relu_alpha_ = vec4<${r}>(${t.alpha});`,t.cacheKey)),0},Uo=e=>{e.compute(Ae(e.inputs[0],"Log","log"))},No=(e,t)=>`
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
`,Lo=e=>`quick_gelu_impl(${e})`,Vo=(e,t)=>{let r=k(e.inputs[0].dataType);e.compute(Ae(e.inputs[0],"QuickGelu",Lo,No(r,t.alpha),t.cacheKey,e.inputs[0].dataType))}}),Wo,Fo,qo,Sc=I(()=>{ae(),re(),yn(),Wo=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![2560,5120,10240].includes(e[0].dims[2]))throw new Error("hidden state should be 2560, 5120 or 10240");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},Fo=e=>{let t=e[0].dims.slice();t[2]=t[2]/2;let r=z("input",e[0].dataType,e[0].dims,4),i=z("bias",e[0].dataType,[e[0].dims[2]],4),a=H("output",e[0].dataType,t,4),n=U.size(t)/4,s=A(e[0].dataType);return{name:"BiasSplitGelu",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(n/64)}}),getShaderSource:o=>`
  const M_SQRT2 = sqrt(2.0);
  const halfChannels = ${e[0].dims[2]/4/2}u;

  ${o.declareVariables(r,i,a)}

  ${Ra(s)}

  ${o.mainStart()}
    ${o.guardAgainstOutOfBoundsWorkgroupSizes(n)}
    let biasIdx = global_idx % halfChannels;
    let batchIndex = global_idx / halfChannels;
    let inputOffset = biasIdx + batchIndex * halfChannels * 2;
    let valueLeft = input[inputOffset] + bias[biasIdx];
    let valueRight = input[inputOffset + halfChannels] + bias[biasIdx + halfChannels];
    let geluRight = valueRight * 0.5 * (erf_vf32(valueRight / M_SQRT2) + 1);

    ${a.setByOffset("global_idx","valueLeft * geluRight")}
  }`}},qo=e=>{Wo(e.inputs),e.compute(Fo(e.inputs))}}),Go,jo,qt,Ho,Ko,Zo,Qo,Xo,Yo,Jo,eu,tu,ru,Tc=I(()=>{pe(),ae(),re(),Go=(e,t,r,i,a,n,s,o,u,l,d,p)=>{let h,f;typeof o=="string"?h=f=(w,S)=>`${o}((${w}),(${S}))`:typeof o=="function"?h=f=o:(h=o.scalar,f=o.vector);let m=H("outputData",d,i.length,4),y=z("aData",u,t.length,4),$=z("bData",l,r.length,4),_;if(a)if(n){let w=U.size(t)===1,S=U.size(r)===1,x=t.length>0&&t[t.length-1]%4===0,C=r.length>0&&r[r.length-1]%4===0;w||S?_=m.setByOffset("global_idx",f(w?`${y.type.value}(${y.getByOffset("0")}.x)`:y.getByOffset("global_idx"),S?`${$.type.value}(${$.getByOffset("0")}.x)`:$.getByOffset("global_idx"))):_=`
            let outputIndices = ${m.offsetToIndices("global_idx * 4u")};
            let offsetA = ${y.broadcastedIndicesToOffset("outputIndices",m)};
            let offsetB = ${$.broadcastedIndicesToOffset("outputIndices",m)};
            ${m.setByOffset("global_idx",f(s||x?y.getByOffset("offsetA / 4u"):`${y.type.value}(${y.getByOffset("offsetA / 4u")}[offsetA % 4u])`,s||C?$.getByOffset("offsetB / 4u"):`${$.type.value}(${$.getByOffset("offsetB / 4u")}[offsetB % 4u])`))}
          `}else _=m.setByOffset("global_idx",f(y.getByOffset("global_idx"),$.getByOffset("global_idx")));else{if(!n)throw new Error("no necessary to use scalar implementation for element-wise binary op implementation.");let w=(S,x,C="")=>{let D=`aData[indexA${x}][componentA${x}]`,M=`bData[indexB${x}][componentB${x}]`;return`
            let outputIndices${x} = ${m.offsetToIndices(`global_idx * 4u + ${x}u`)};
            let offsetA${x} = ${y.broadcastedIndicesToOffset(`outputIndices${x}`,m)};
            let offsetB${x} = ${$.broadcastedIndicesToOffset(`outputIndices${x}`,m)};
            let indexA${x} = offsetA${x} / 4u;
            let indexB${x} = offsetB${x} / 4u;
            let componentA${x} = offsetA${x} % 4u;
            let componentB${x} = offsetB${x} % 4u;
            ${S}[${x}] = ${C}(${h(D,M)});
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
        ${e.registerUniform("vec_size","u32").declareVariables(y,$,m)}

        ${p??""}

        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${_}
      }`},jo=(e,t,r,i,a,n,s=r.dataType)=>{let o=r.dims.map(y=>Number(y)??1),u=i.dims.map(y=>Number(y)??1),l=!U.areEqual(o,u),d=o,p=U.size(o),h=!1,f=!1,m=[l];if(l){let y=Ht.calcShape(o,u,!1);if(!y)throw new Error("Can't perform binary op on the given tensors");d=y.slice(),p=U.size(d);let $=U.size(o)===1,_=U.size(u)===1,w=o.length>0&&o[o.length-1]%4===0,S=u.length>0&&u[u.length-1]%4===0;m.push($),m.push(_),m.push(w),m.push(S);let x=1;for(let C=1;C<d.length;C++){let D=o[o.length-C],M=u[u.length-C];if(D===M)x*=D;else break}x%4===0?(f=!0,h=!0):($||_||w||S)&&(h=!0)}else h=!0;return m.push(h),{name:e,shaderCache:{hint:t+m.map(y=>y.toString()).join("_"),inputDependencies:["rank","rank"]},getShaderSource:y=>Go(y,o,u,d,h,l,f,a,r.dataType,i.dataType,s,n),getRunData:()=>({outputs:[{dims:d,dataType:s}],dispatchGroup:{x:Math.ceil(p/64/4)},programUniforms:[{type:12,data:Math.ceil(U.size(d)/4)},...E(o,u,d)]})}},qt=(e,t,r,i,a,n)=>{e.compute(jo(t,a??"",e.inputs[0],e.inputs[1],r,i,n))},Ho=e=>{qt(e,"Add",(t,r)=>`${t}+${r}`)},Ko=e=>{qt(e,"Div",(t,r)=>`${t}/${r}`)},Zo=e=>{qt(e,"Equal",{scalar:(t,r)=>`u32(${t}==${r})`,vector:(t,r)=>`vec4<u32>(${t}==${r})`},void 0,void 0,9)},Qo=e=>{qt(e,"Mul",(t,r)=>`${t}*${r}`)},Xo=e=>{let t=z("input",e.inputs[0].dataType,e.inputs[0].dims).type.value;qt(e,"Pow",{scalar:(r,i)=>`pow_custom(${r},${i})`,vector:(r,i)=>`pow_vector_custom(${r},${i})`},`
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
      `)},Yo=e=>{qt(e,"Sub",(t,r)=>`${t}-${r}`)},Jo=e=>{qt(e,"Greater",{scalar:(t,r)=>`u32(${t}>${r})`,vector:(t,r)=>`vec4<u32>(${t}>${r})`},void 0,void 0,9)},eu=e=>{qt(e,"Less",{scalar:(t,r)=>`u32(${t}<${r})`,vector:(t,r)=>`vec4<u32>(${t}<${r})`},void 0,void 0,9)},tu=e=>{qt(e,"GreaterOrEqual",{scalar:(t,r)=>`u32(${t}>=${r})`,vector:(t,r)=>`vec4<u32>(${t}>=${r})`},void 0,void 0,9)},ru=e=>{qt(e,"LessOrEqual",{scalar:(t,r)=>`u32(${t}<=${r})`,vector:(t,r)=>`vec4<u32>(${t}<=${r})`},void 0,void 0,9)}}),iu,au,nu,su,ou,uu,Ec=I(()=>{pe(),ae(),b(),re(),iu=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");let r=0,i=e[r],a=i.dataType,n=i.dims.length;e.forEach((s,o)=>{if(o!==r){if(s.dataType!==a)throw new Error("input tensors should be one type");if(s.dims.length!==n)throw new Error("input tensors should have the same shape");s.dims.forEach((u,l)=>{if(l!==t&&u!==i.dims[l])throw new Error("non concat dimensions must match")})}})},au=(e,t)=>`
  fn calculateInputIndex(index: u32) -> u32 {
    let sizeInConcatAxis = array<u32, ${e}u>(${t});
    for (var i: u32 = 0u; i < ${e}; i += 1u ) {
      if (index < sizeInConcatAxis[i]) {
        return i;
      }
    }
    return ${e}u;
  }`,nu=(e,t)=>{let r=e.length,i=[];for(let a=0;a<r;++a){let n=t.setByOffset("global_idx",e[a].getByIndices("indices"));r===1?i.push(n):a===0?i.push(`if (inputIndex == ${a}u) { ${n} }`):a===r-1?i.push(`else { ${n} }`):i.push(`else if (inputIndex == ${a}) { ${n} }`)}return i.join(`
`)},su=(e,t,r,i)=>{let a=U.size(r),n=new Array(e.length),s=new Array(e.length),o=0,u=[],l=[],d=[{type:12,data:a}];for(let y=0;y<e.length;++y)o+=e[y].dims[t],n[y]=o,l.push(e[y].dims.length),s[y]=z(`input${y}`,i,l[y]),u.push("rank"),d.push({type:12,data:n[y]});for(let y=0;y<e.length;++y)d.push(...E(e[y].dims));d.push(...E(r));let p=H("output",i,r.length),h=p.indicesGet("indices",t),f=Array.from(Array(n.length).keys()).map(y=>`uniforms.sizeInConcatAxis${y}`).join(","),m=y=>`

  ${(()=>{y.registerUniform("outputSize","u32");for(let $=0;$<e.length;$++)y.registerUniform(`sizeInConcatAxis${$}`,"u32");return y.declareVariables(...s,p)})()}

  ${au(n.length,f)}

  ${y.mainStart()}
    ${y.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

    var indices = ${p.offsetToIndices("global_idx")};

    let inputIndex = calculateInputIndex(${h});
    if (inputIndex != 0u) {
      let sizeInConcatAxis = array<u32, ${n.length}u>(${f});
      ${h} -= sizeInConcatAxis[inputIndex - 1u];
    }

    ${nu(s,p)}
  }`;return{name:"Concat",shaderCache:{hint:`${t}`,inputDependencies:u},getRunData:()=>({outputs:[{dims:r,dataType:i}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:d}),getShaderSource:m}},ou=(e,t)=>{let r=e.inputs,i=r[0].dims,a=U.normalizeAxis(t.axis,i.length);iu(r,a);let n=i.slice();n[a]=r.reduce((o,u)=>o+(u.dims.length>a?u.dims[a]:0),0);let s=r.filter(o=>U.size(o.dims)>0);e.compute(su(s,a,n,r[0].dataType),{inputs:s})},uu=e=>g({axis:e.axis})}),Hr,Kr,Zr,wn,Qr=I(()=>{pe(),ae(),Hr=(e,t,r="f32")=>{switch(e.activation){case"Relu":return`value = max(value, ${t}(0.0));`;case"Sigmoid":return`value = (${t}(1.0) / (${t}(1.0) + exp(-value)));`;case"Clip":return`value = clamp(value, ${t}(${r}(uniforms.clip_min)), ${t}(${r}(uniforms.clip_max)));`;case"HardSigmoid":return`value = max(${t}(0.0), min(${t}(1.0), ${r}(uniforms.alpha) * value + ${r}(uniforms.beta)));`;case"LeakyRelu":return`value = select(${r}(uniforms.alpha) * value, value, value >= ${t}(0.0));`;case"Tanh":return`let e2x = exp(-2.0 * abs(value));
              value = sign(value) * (1.0 - e2x) / (1.0 + e2x);
        `;case"":return"";default:throw new Error(`Unsupported activation ${e.activation}`)}},Kr=(e,t)=>{e.activation==="Clip"?t.push({type:1,data:e.clipMax},{type:1,data:e.clipMin}):e.activation==="HardSigmoid"?t.push({type:1,data:e.alpha},{type:1,data:e.beta}):e.activation==="LeakyRelu"&&t.push({type:1,data:e.alpha})},Zr=(e,t)=>{e.activation==="Clip"?t.push({name:"clip_max",type:"f32"},{name:"clip_min",type:"f32"}):e.activation==="HardSigmoid"?t.push({name:"alpha",type:"f32"},{name:"beta",type:"f32"}):e.activation==="LeakyRelu"&&t.push({name:"alpha",type:"f32"})},wn=e=>{let t=(e==null?void 0:e.activation)||"";if(t==="HardSigmoid"){let[r,i]=(e==null?void 0:e.activation_params)||[.2,.5];return{activation:t,alpha:r,beta:i}}else if(t==="Clip"){let[r,i]=(e==null?void 0:e.activation_params)||[Yi,Mt];return{activation:t,clipMax:i,clipMin:r}}else if(t==="LeakyRelu"){let[r]=(e==null?void 0:e.activation_params)||[.01];return{activation:t,alpha:r}}return{activation:t}}}),at,lu,_n=I(()=>{at=(e,t)=>{switch(e){case 1:return t;case 2:return`vec2<${t}>`;case 3:return`vec3<${t}>`;case 4:return`vec4<${t}>`;default:throw new Error(`${e}-component is not supported.`)}},lu=e=>`
      ${e?"value = value + getBiasByOutputCoords(coords);":""}
      `}),du,kc=I(()=>{du=e=>`
fn getIndexFromCoords4D(coords : vec4<i32>, shape : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
      shape.y * shape.z * shape.w, shape.z * shape.w, shape.w, 1));
}
fn getOutputIndexFromCoords(coords : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
    i32(${e}.x), i32(${e}.y), i32(${e}.z), 1));
}
`}),da,bn,$n=I(()=>{pe(),ae(),re(),Qr(),da=(e,t,r,i,a)=>{let n=i-r;return`
      ${Array.from({length:r}).map((s,o)=>`
      if (${P(t.shape,o,t.rank)} != 1) {
        ${t.indicesSet(e,o,P(a,o+n,i))}
      } else {
        ${t.indicesSet(e,o,0)}
      }`).join("")}
`},bn=(e,t,r,i,a=!1,n)=>{let s=e[0].dims,o=e[1].dims,u=s[s.length-2],l=o[o.length-1],d=s[s.length-1],p=O(l),h=O(d),f=O(u),m=U.size(r)/p/f,y=e.length>2,$=i?i.slice(0,-2):r.slice(0,-2),_=[U.size($),u,l],w=[{type:12,data:m},{type:12,data:u},{type:12,data:l},{type:12,data:d}];Kr(t,w),w.push(...E($,s,o)),y&&w.push(...E(e[2].dims)),w.push(...E(_));let S=x=>{let C=_e("batch_dims",e[0].dataType,$.length),D=z("a",e[0].dataType,s.length,h),M=z("b",e[1].dataType,o.length,p),N=H("output",e[0].dataType,_.length,p),V=A(N.type.tensor),Z=Hr(t,N.type.value,V),de=[D,M],ee="";if(y){let be=a?p:1;de.push(z("bias",e[2].dataType,e[2].dims.length,be)),ee=`${a?`value += bias[col / ${be}];`:`value += ${N.type.value}(bias[row + i]);`}`}let ue=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"}];Zr(t,ue);let ze=()=>{let be=`var a_data: ${D.type.value};`;for(let ne=0;ne<h;ne++)be+=`
              let b_data${ne} = b[(b_offset + (k + ${ne}) * uniforms.N + col) / ${p}];`;for(let ne=0;ne<f;ne++){be+=`a_data = a[(a_offset + (row + ${ne}) * uniforms.K + k) / ${h}];`;for(let ve=0;ve<h;ve++)be+=`
            values[${ne}] = fma(${M.type.value}(a_data${h===1?"":`[${ve}]`}), b_data${ve}, values[${ne}]);
`}return be};return`
  ${x.registerUniforms(ue).registerInternalVariables(C).declareVariables(...de,N)}
  ${x.mainStart()}
    ${x.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let col = (global_idx % (uniforms.N / ${p})) * ${p};
    var index1 = global_idx / (uniforms.N / ${p});
    let stride1 = uniforms.M / ${f};
    let row = (index1 % stride1) * ${f};
    let batch = index1 / stride1;

    ${r.length===2?"":`let batch_indices = ${C.offsetToIndices("batch")};`}

    var a_indices: ${D.type.indices};
    ${da("a_indices",D,D.rank-2,C.rank,"batch_indices")}
    ${D.indicesSet("a_indices",D.rank-2,0)}
    ${D.indicesSet("a_indices",D.rank-1,0)}
    let a_offset = ${D.indicesToOffset("a_indices")};

    var b_indices: ${M.type.indices};
    ${da("b_indices",M,M.rank-2,C.rank,"batch_indices")}
    ${M.indicesSet("b_indices",M.rank-2,0)}
    ${M.indicesSet("b_indices",M.rank-1,0)}
    let b_offset = ${M.indicesToOffset("b_indices")};
    var values: array<${N.type.value}, ${f}>;
    for (var k: u32 = 0u; k < uniforms.K; k = k + ${h}) {
      ${ze()}
    }
    for (var i = 0u; i < ${f}u; i++) {
      var value = values[i];
      ${ee}
      ${Z}
      let cur_indices = ${N.type.indices}(batch, row + i, col);
      let offset = ${N.indicesToOffset("cur_indices")};
      ${N.setByOffset(`offset / ${p}`,"value")};
    }
  }
  `};return{name:"MatMulNaive",shaderCache:{hint:`${t.activation};${p};${h};${f};${a}`,inputDependencies:y?["rank","rank","rank"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:n?n(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:w}),getShaderSource:S}}}),pu,cu,vn,xn,hu,Sn,fu,Ba,Tn=I(()=>{pe(),ae(),re(),Qr(),$n(),_n(),pu=(e,t)=>e?`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          kStart + inputRow,
          globalRowStart / innerElementSize + inputCol${t?", batchIndices":""});
        `:`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          globalRow + innerRow,
          kStart / innerElementSize + inputCol${t?", batchIndices":""});
        `,cu=(e,t)=>e?`
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
        }`,vn=(e,t,r="f32",i,a=!1,n=32,s=!1,o=32)=>{let u=t[1]*e[1],l=t[0]*e[0],d=a?u:n,p=a?n:u,h=d/t[0],f=n/t[1];if(!((a&&h===4&&e[1]===4||!a&&(h===3||h===4))&&d%t[0]===0&&n%t[1]===0&&e[0]===4))throw new Error(`If transposeA ${a} is true, innerElementSize ${h} and workPerThread[1] ${e[1]} must be 4.
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
          ${pu(a,i)}
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

          ${cu(a,h)}
      }

      workgroupBarrier();
  }

  for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      mm_write(batch, globalRow + innerRow, globalCol, acc[innerRow]);
  }
}`},xn=(e,t)=>e?`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              kStart + inputRow,
              globalRowStart + inputCol${t?", batchIndices":""});
            `:`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              globalRowStart + inputRow,
              kStart + inputCol${t?", batchIndices":""});
            `,hu=e=>e?"let ACached = mm_Asub[k][tileRow + innerRow];":"let ACached = mm_Asub[tileRow + innerRow][k];",Sn=(e,t,r="f32",i,a=!1,n=32,s=!1,o=32,u=!1)=>{let l=e[1]*t[1],d=e[0]*t[0],p=a?l:n,h=a?n:l;if(!(h%t[1]===0&&p%t[0]===0&&n%t[1]===0))throw new Error(`tileAHight ${h} must be divisible by workgroupSize[1]${t[1]}, tileAWidth ${p} must be divisible by workgroupSize[0]${t[0]}, tileInner ${n} must be divisible by workgroupSize[1]${t[1]}`);let f=h/t[1],m=p/t[0],y=n/t[1],$=u?`
    let localRow = i32(localId.y);
    let localCol = i32(localId.x);
    let globalRowStart = i32(workgroupId.y) * ${l};
    let globalColStart = i32(workgroupId.x) * ${d};

    // Loop over shared dimension.
    for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var inputRow = localRow; inputRow < ${h}; inputRow = inputRow + ${t[1]}) {
        for (var inputCol = localCol; inputCol < ${p}; inputCol = inputCol + ${t[0]}) {
          ${xn(a,i)}
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
      ${xn(a,i)}
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
      ${hu(a)}
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
    ${$}
  }
`},fu=(e,t,r,i,a=!1)=>{let[n,s,o,u]=i,l=A(i[0].type.tensor);return`
    fn mm_readA(batch: i32, row: i32, colIn: i32, batchIndices: ${n.type.indices}) -> ${at(e,l)} {
      var value = ${at(e,l)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_a_outer && col < uniforms.dim_inner)
      {
        var aIndices: ${s.type.indices};
        ${da("aIndices",s,s.rank-2,n.rank,"batchIndices")}
        ${s.indicesSet("aIndices",s.rank-2,"u32(row)")}
        ${s.indicesSet("aIndices",s.rank-1,"u32(colIn)")}
        value = ${s.getByIndices("aIndices")};
      }
      return value;
    }

    fn mm_readB(batch: i32, row: i32, colIn: i32, batchIndices: ${n.type.indices}) -> ${at(e,l)} {
      var value = ${at(e,l)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_inner && col < uniforms.dim_b_outer)
      {
        var bIndices: ${o.type.indices};
        ${da("bIndices",o,o.rank-2,n.rank,"batchIndices")}
        ${o.indicesSet("bIndices",o.rank-2,"u32(row)")}
        ${o.indicesSet("bIndices",o.rank-1,"u32(colIn)")}
        value = ${o.getByIndices("bIndices")};
      }
      return value;
    }

    fn mm_write(batch: i32, row: i32, colIn: i32, valueIn: ${at(e,l)}) {
      let col = colIn * ${e};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer) {
        var value = valueIn;
        let coords = vec3<i32>(batch, row, colIn);
        ${t?`value = value + ${a?"bias[colIn]":`${at(e,l)}(bias[row])`};`:""}
        ${r}
        ${u.setByIndices("vec3<u32>(coords)","value")}
      }
    }
    `},Ba=(e,t,r,i,a=!1,n)=>{let s=e[0].dims,o=e[1].dims,u=s.slice(0,-2),l=o.slice(0,-2),d=i?i.slice(0,-2):r.slice(0,-2),p=U.size(d),h=s[s.length-2],f=s[s.length-1],m=o[o.length-1],y=f%4===0&&m%4===0,$=h<=8?[4,1,1]:[4,4,1],_=[8,8,1],w=[Math.ceil(m/_[0]/$[0]),Math.ceil(h/_[1]/$[1]),Math.ceil(p/_[2]/$[2])],S=y?4:1,x=[...u,h,f/S],C=x.length,D=[...l,f,m/S],M=D.length,N=[p,h,m/S],V=[{type:6,data:h},{type:6,data:m},{type:6,data:f}];Kr(t,V),V.push(...E(d,x,D));let Z=["rank","rank"],de=e.length>2;de&&(V.push(...E(e[2].dims)),Z.push("rank")),V.push(...E(N));let ee=ue=>{let ze=d.length,be=_e("batchDims",e[0].dataType,ze,1),ne=A(e[0].dataType),ve=z("a",e[0].dataType,C,S),ie=z("b",e[1].dataType,M,S),fe=H("result",e[0].dataType,N.length,S),st=[ve,ie];if(de){let kt=a?S:1;st.push(z("bias",e[2].dataType,e[2].dims.length,kt))}let W=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"}];Zr(t,W);let X=A(fe.type.tensor),se=Hr(t,fe.type.value,X),xe=fu(S,de,se,[be,ve,ie,fe],a);return`
  ${ue.registerUniforms(W).registerInternalVariables(be).declareVariables(...st,fe)}
  ${xe}
  ${y?vn($,_,ne,be):Sn($,_,ne,be)}
                   `};return{name:"MatMul",shaderCache:{hint:`${$};${t.activation};${y};${a}`,inputDependencies:Z},getRunData:()=>({outputs:[{dims:n?n(r):r,dataType:e[0].dataType}],dispatchGroup:{x:w[0],y:w[1],z:w[2]},programUniforms:V}),getShaderSource:ee}}}),mu,gu,Ic=I(()=>{pe(),Tt(),re(),Qr(),_n(),kc(),Tn(),mu=(e,t,r,i,a=!1,n,s=4,o=4,u=4,l="f32")=>{let d=V=>{switch(V){case 1:return"resData = x[xIndex];";case 3:return`resData = vec3<${l}>(x[xIndex], x[xIndex + 1], x[xIndex + 2]);`;case 4:return"resData = x[xIndex / 4];";default:throw new Error(`innerElementSize ${V} is not supported.`)}},p=V=>{switch(V){case 1:return"return w[row * i32(uniforms.w_shape[3]) + colIn];";case 4:return"return w[row * i32(uniforms.w_shape[3]) / 4 + colIn];";default:throw new Error(`innerElementSize ${V} is not supported.`)}},h=e?`
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
    `,m=e?"i32(uniforms.x_shape[1])":"i32(uniforms.x_shape[2])",y=e?"i32(uniforms.x_shape[2])":"i32(uniforms.x_shape[3])",$=e?"row":"col",_=e?"col":"row",w=`
    let inChannels = i32(uniforms.w_shape[2]);
    let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
    let outRow = ${$} / outWidth;
    let outCol = ${$} % outWidth;

    let WRow = ${_} / (i32(uniforms.w_shape[1]) * inChannels);
    let WCol = ${_} / inChannels % i32(uniforms.w_shape[1]);
    let xRow = outRow * uniforms.stride[0] + uniforms.dilation[0] * WRow - uniforms.pad[0];
    let xCol = outCol * uniforms.stride[1] + uniforms.dilation[1] * WCol - uniforms.pad[1];
    let xCh = ${_} % inChannels;
    var resData = ${at(s,l)}(0.0);
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
    return ${at(s,l)}(0.0);`:i&&r?`
    let col = colIn * ${s};
    ${w}`:`
    let col = colIn * ${s};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${w}
    }
    return ${at(s,l)}(0.0);`,x=e?i&&r?p(o):`
    let col = colIn * ${o};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${p(o)}
    }
    return ${at(o,l)}(0.0);`:`
    let col = colIn * ${o};
    if (row < uniforms.dim_inner && col < uniforms.dim_a_outer) {
      ${p(o)}
    }
    return ${at(o,l)}(0.0);`,C=at(u,l),D=at(e?s:o,l),M=at(e?o:s,l),N=Hr(n,C,l);return`
    fn mm_readA(batch: i32, row : i32, colIn : i32) -> ${D} {
      ${e?S:x}
    }

    fn mm_readB(batch: i32, row : i32, colIn : i32) -> ${M} {
      ${e?x:S}
    }

    fn mm_write(batch: i32, row : i32, colIn : i32, valueIn : ${C}) {
      let col = colIn * ${u};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer)
      {
      var value = valueIn;
      let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
      ${f}
      ${lu(a)}
      ${N}
      setOutputAtCoords(coords[0], coords[1], coords[2], coords[3], value);
      }
    }`},gu=(e,t,r,i,a,n,s,o,u)=>{let l=t.format==="NHWC",d=l?e[0].dims[3]:e[0].dims[1],p=r[0],h=l?r[2]:r[3],f=l?r[1]:r[2],m=l?r[3]:r[1],y=l&&(d%4===0||d%3===0)&&m%4===0,$=l?m:h*f,_=l?h*f:m,w=[8,8,1],S=i<=8?[4,1,1]:[4,4,1],x=[Math.ceil($/w[0]/S[0]),Math.ceil(_/w[1]/S[1]),Math.ceil(p/w[2]/S[2])];Te("verbose",()=>`[conv2d_mm_webgpu] dispatch = ${x}`);let C=y?l&&d%4!==0?3:4:1,D=w[1]*S[1],M=w[0]*S[0],N=Math.max(w[0]*C,w[1]),V=i%D===0,Z=a%M===0,de=n%N===0,ee=y?[C,4,4]:[1,1,1],ue=[{type:6,data:i},{type:6,data:a},{type:6,data:n},{type:6,data:[t.pads[0],t.pads[1]]},{type:6,data:t.strides},{type:6,data:t.dilations}];Kr(t,ue),ue.push(...E(e[0].dims,e[1].dims));let ze=["rank","rank"];s&&(ue.push(...E(e[2].dims)),ze.push("rank")),ue.push(...E(r));let be=ne=>{let ve=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"},{name:"pad",type:"i32",length:2},{name:"stride",type:"i32",length:2},{name:"dilation",type:"i32",length:2}];Zr(t,ve);let ie=y?4:1,fe=A(e[0].dataType),st=`
      fn setOutputAtIndex(flatIndex : i32, value : ${y?`vec4<${fe}>`:fe}) {
        result[flatIndex] = ${y?`vec4<${fe}>`:fe}(value);
      }
      fn setOutputAtCoords(d0 : i32, d1 : i32, d2 : i32, d3 : i32, value : ${y?`vec4<${fe}>`:fe}) {
        let flatIndex = getOutputIndexFromCoords(vec4<i32>(d0, d1, d2, d3));
        setOutputAtIndex(flatIndex ${y?"/ 4":""}, value);
      }`,W=z("x",e[0].dataType,e[0].dims.length,C===3?1:C),X=z("w",e[1].dataType,e[1].dims.length,ie),se=[W,X],xe=H("result",e[0].dataType,r.length,ie);if(s){let kt=z("bias",e[2].dataType,e[2].dims.length,ie);se.push(kt),st+=`
        fn getBiasByOutputCoords(coords : vec4<i32>) -> ${y?`vec4<${fe}>`:fe} {
          return bias[coords.${l?"w":"y"}${y?"/ 4":""}];
        }`}return`
        ${du("uniforms.result_strides")}
        //struct Uniforms { xShape : vec4<i32>, wShape : vec4<i32>, outShape : vec4<i32>,
        //  outShapeStrides: vec3<i32>, filterDims : vec2<i32>, pad : vec2<i32>, stride : vec2<i32>,
        //  dilation : vec2<i32>, dimAOuter : i32, dimBOuter : i32, dimInner : i32 };
        ${ne.registerUniforms(ve).declareVariables(...se,xe)}
        ${st}
        ${mu(l,V,Z,de,s,t,ee[0],ee[1],ee[2],fe)}
        ${y?vn(S,w,fe,void 0,!l,N):Sn(S,w,fe,void 0,!l,N,!1,void 0,o)}`};return{name:"Conv2DMatMul",shaderCache:{hint:`${t.cacheKey};${C};${y};${V};${Z};${de};${D};${M};${N}`,inputDependencies:ze},getRunData:()=>({outputs:[{dims:u?u(r):r,dataType:e[0].dataType}],dispatchGroup:{x:x[0],y:x[1],z:x[2]},programUniforms:ue}),getShaderSource:be}}}),yu,En,pa,wu,kn,_u,bu,$u,Cc=I(()=>{pe(),Tt(),ae(),re(),Qr(),_n(),yu=e=>{let t=1;for(let r=0;r<e.length;r++)t*=e[r];return t},En=e=>typeof e=="number"?[e,e,e]:e,pa=(e,t)=>t<=1?e:e+(e-1)*(t-1),wu=(e,t,r,i=1)=>{let a=pa(t,i);return Math.floor((e[0]*(r-1)-r+a)/2)},kn=(e,t,r,i,a)=>{a==null&&(a=wu(e,t[0],i[0]));let n=[0,0,0,r];for(let s=0;s<3;s++)e[s]+2*a>=t[s]&&(n[s]=Math.trunc((e[s]-t[s]+2*a)/i[s]+1));return n},_u=(e,t,r,i,a,n,s,o,u,l)=>{let d,p,h,f;if(e==="VALID"&&(e=0),typeof e=="number"){d={top:e,bottom:e,left:e,right:e,front:e,back:e};let m=kn([t,r,i,1],[o,u,l],1,[a,n,s],e);p=m[0],h=m[1],f=m[2]}else if(Array.isArray(e)){if(!e.every((y,$,_)=>y===_[0]))throw Error(`Unsupported padding parameter: ${e}`);d={top:e[0],bottom:e[1],left:e[2],right:e[3],front:e[4],back:e[5]};let m=kn([t,r,i,1],[o,u,l],1,[a,n,s],e[0]);p=m[0],h=m[1],f=m[2]}else if(e==="SAME_UPPER"){p=Math.ceil(t/a),h=Math.ceil(r/n),f=Math.ceil(i/s);let m=(p-1)*a+o-t,y=(h-1)*n+u-r,$=(f-1)*s+l-i,_=Math.floor(m/2),w=m-_,S=Math.floor(y/2),x=y-S,C=Math.floor($/2),D=$-C;d={top:S,bottom:x,left:C,right:D,front:_,back:w}}else throw Error(`Unknown padding parameter: ${e}`);return{padInfo:d,outDepth:p,outHeight:h,outWidth:f}},bu=(e,t,r,i,a,n=!1,s="channelsLast")=>{let o,u,l,d,p;if(s==="channelsLast")[o,u,l,d,p]=e;else if(s==="channelsFirst")[o,p,u,l,d]=e;else throw new Error(`Unknown dataFormat ${s}`);let[h,,f,m,y]=t,[$,_,w]=En(r),[S,x,C]=En(i),D=pa(f,S),M=pa(m,x),N=pa(y,C),{padInfo:V,outDepth:Z,outHeight:de,outWidth:ee}=_u(a,u,l,d,$,_,w,D,M,N),ue=n?h*p:h,ze=[0,0,0,0,0];return s==="channelsFirst"?ze=[o,ue,Z,de,ee]:s==="channelsLast"&&(ze=[o,Z,de,ee,ue]),{batchSize:o,dataFormat:s,inDepth:u,inHeight:l,inWidth:d,inChannels:p,outDepth:Z,outHeight:de,outWidth:ee,outChannels:ue,padInfo:V,strideDepth:$,strideHeight:_,strideWidth:w,filterDepth:f,filterHeight:m,filterWidth:y,effectiveFilterDepth:D,effectiveFilterHeight:M,effectiveFilterWidth:N,dilationDepth:S,dilationHeight:x,dilationWidth:C,inShape:e,outShape:ze,filterShape:t}},$u=(e,t,r,i,a,n)=>{let s=n==="channelsLast";s?e[0].dims[3]:e[0].dims[1];let o=[64,1,1],u={x:r.map(($,_)=>_)},l=[Math.ceil(yu(u.x.map($=>r[$]))/o[0]),1,1];Te("verbose",()=>`[conv3d_naive_webgpu] dispatch = ${l}`);let d=1,p=U.size(r),h=[{type:12,data:p},{type:12,data:i},{type:12,data:a},{type:12,data:t.strides},{type:12,data:t.dilations}];Kr(t,h),h.push(...E(e[0].dims,e[1].dims));let f=["rank","rank"],m=e.length===3;m&&(h.push(...E(e[2].dims)),f.push("rank")),h.push(...E(r));let y=$=>{let _=[{name:"output_size",type:"u32"},{name:"filter_dims",type:"u32",length:i.length},{name:"pads",type:"u32",length:a.length},{name:"strides",type:"u32",length:t.strides.length},{name:"dilations",type:"u32",length:t.dilations.length}];Zr(t,_);let w=1,S=A(e[0].dataType),x=z("x",e[0].dataType,e[0].dims.length,d),C=z("W",e[1].dataType,e[1].dims.length,w),D=[x,C],M=H("result",e[0].dataType,r.length,w),N="";if(m){let de=z("bias",e[2].dataType,e[2].dims.length,w);D.push(de),N+=`
        fn getBiasByOutputCoords(coords : array<u32, 5>) -> ${S} {
          return bias[${s?P("coords",4,5):P("coords",1,5)}];
        }`}let V=at(d,S),Z=Hr(t,V,S);return`
            ${N}
            fn getX(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${x.getByIndices("aIndices")};
            }
            fn getW(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${C.getByIndices("aIndices")};
            }
          ${$.registerUniforms(_).declareVariables(...D,M)}
          ${$.mainStart()}
          ${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
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
              ${Z}
              result[global_idx] = f32(value);
          }`};return{name:"Conv3DNaive",shaderCache:{hint:`${t.cacheKey};${s};${d};${m}`,inputDependencies:f},getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:l[0],y:l[1],z:l[2]},programUniforms:h}),getShaderSource:y}}}),vu,xu,zc=I(()=>{pe(),ae(),re(),Qr(),vu=(e,t,r,i)=>{let a=e.length>2,n=a?"value += b[output_channel];":"",s=e[0].dims,o=e[1].dims,u=t.format==="NHWC",l=u?r[3]:r[1],d=l/t.group,p=u&&d>=4?O(l):1,h=U.size(r)/p,f=[{type:12,data:h},{type:12,data:t.dilations},{type:12,data:[t.strides[0],t.strides[1]]},{type:12,data:[t.pads[0],t.pads[1]]},{type:12,data:d}];Kr(t,f),f.push(...E(s,[o[0],o[1],o[2],o[3]/p]));let m=a?["rank","rank","rank"]:["rank","rank"];f.push(...E([r[0],r[1],r[2],r[3]/p]));let y=$=>{let _=H("output",e[0].dataType,r.length,p),w=A(_.type.tensor),S=Hr(t,_.type.value,w),x=z("x",e[0].dataType,s.length),C=z("w",e[1].dataType,o.length,p),D=[x,C];a&&D.push(z("b",e[2].dataType,e[2].dims,p));let M=[{name:"output_size",type:"u32"},{name:"dilations",type:"u32",length:t.dilations.length},{name:"strides",type:"u32",length:2},{name:"pads",type:"u32",length:2},{name:"output_channels_per_group",type:"u32"}];Zr(t,M);let N=u?`
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
            let wVal = ${C.get("wHeight","wWidth","wInChannel","output_channel")};
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
            let wVal = ${C.get("output_channel","wInChannel","wHeight","wWidth")};
            value += xVal * wVal;
          }
        }
      }
      `;return`
  ${$.registerUniforms(M).declareVariables(...D,_)}

  ${$.mainStart()}
    ${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

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
  }`};return{name:"GroupedConv",shaderCache:{hint:`${t.cacheKey}_${p}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:i?i(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(h/64)},programUniforms:f}),getShaderSource:y}},xu=(e,t,r,i)=>{let a=e.length>2,n=O(r[3]),s=O(r[2]),o=U.size(r)/n/s,u=[e[0].dims[0],e[0].dims[1],e[0].dims[2],e[0].dims[3]/n],l=[e[1].dims[0],e[1].dims[1],e[1].dims[2],e[1].dims[3]/n],d=[r[0],r[1],r[2],r[3]/n],p=[{type:12,data:o},{type:6,data:[t.strides[0],t.strides[1]]},{type:6,data:[t.pads[0],t.pads[1]]}];Kr(t,p),p.push(...E(u,l,d));let h=(s-1)*t.strides[1]+l[1],f=m=>{let y=H("output",e[0].dataType,d.length,n),$=A(y.type.tensor),_=Hr(t,y.type.value,$),w=z("x",e[0].dataType,u.length,n),S=z("w",e[1].dataType,l.length,n),x=[w,S];a&&x.push(z("b",e[2].dataType,e[2].dims,n));let C=a?"value += b[output_channel];":"",D=[{name:"output_size",type:"u32"},{name:"strides",type:"i32",length:2},{name:"pads",type:"i32",length:2}];return Zr(t,D),`
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
      ${C}
      ${_}
      ${y.set("batch","row","col + i","output_channel","value")};
    }
  }`};return{name:"GroupedConv-Vectorize",shaderCache:{hint:`${t.cacheKey};${n};${s};${h};${l[0]};${l[1]}`,inputDependencies:a?["rank","rank","type"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:i?i(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(o/64)},programUniforms:p}),getShaderSource:f}}}),Su,Ma,Tu,Da,In,Cn,Eu,ku,zn,Ac=I(()=>{ae(),Ic(),Cc(),Tn(),zc(),Qr(),$n(),it(),Su=(e,t,r,i,a,n)=>{let s=e[0],o=e.slice(n?1:2,n?3:4),u=o.length,l=t[0],d=t.slice(2).map((h,f)=>h+(h-1)*(r[f]-1)),p=o.map((h,f)=>h+i[f]+i[f+u]).map((h,f)=>Math.floor((h-d[f]+a[f])/a[f]));return p.splice(0,0,s),p.splice(n?3:1,0,l),p},Ma=[2,3,1,0],Tu=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length>5)throw new Error("greater than 5D is not supported");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let r=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],i=e[1].dims[1]*t.group;if(r!==i)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");if(e.length===3&&(e[2].dims.length!==1||e[1].dims[0]!==e[2].dims[0]))throw new Error("invalid bias");let a=e[0].dims.length-2;if(t.dilations.length!==a)throw new Error(`dilations should be ${a}D`);if(t.strides.length!==a)throw new Error(`strides should be ${a}D`);if(t.pads.length!==a*2)throw new Error(`pads should be ${a*2}D`);if(t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape")},Da=(e,t)=>{let r=e.kernelShape.slice();r.length<t[1].dims.length-2&&r.push(...Array(t[1].dims.length-2-r.length).fill(0));for(let n=2;n<t[1].dims.length;++n)r[n-2]===0&&(r[n-2]=t[1].dims[n]);let i=e.pads.slice();sr.adjustPadsBasedOnAutoPad(t[0].dims,e.strides,e.dilations,r,i,e.format==="NHWC",e.autoPad);let a=Object.assign({},e);return Object.assign(a,{kernelShape:r,pads:i}),a},In=e=>{let t=wn(e),r=e.format,i=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],a=e.dilations,n=e.group,s=e.kernel_shape,o=e.pads,u=e.strides,l=e.w_is_const();return{autoPad:i,format:r,dilations:a,group:n,kernelShape:s,pads:o,strides:u,wIsConst:l,...t,cacheKey:`${e.format};${t.activation};`}},Cn=(e,t,r,i)=>{let a=r.format==="NHWC",n=Su(t[0].dims,t[1].dims,r.dilations,r.pads,r.strides,a);if(r.group!==1){let D=[t[0]];if(a){let M=e.kernelCustomData.wT??e.compute(pt(t[1],Ma),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=M),D.push(M)}else D.push(t[1]);t.length===3&&D.push(t[2]),!e.adapterInfo.isArchitecture("ampere")&&a&&t[1].dims[0]===r.group&&t[1].dims[1]===1&&r.dilations[0]===1&&r.dilations[1]===1?e.compute(xu(D,r,n,i),{inputs:D}):e.compute(vu(D,r,n,i),{inputs:D});return}let s=t.length===3,o=t[0].dims[a?1:2],u=t[0].dims[a?2:3],l=t[0].dims[a?3:1],d=t[1].dims[2],p=t[1].dims[3],h=n[a?1:2],f=n[a?2:3],m=n[a?3:1],y=a&&d===o&&p===u&&r.pads[0]===0&&r.pads[1]===0;if(y||d===1&&p===1&&r.dilations[0]===1&&r.dilations[1]===1&&r.strides[0]===1&&r.strides[1]===1&&r.pads[0]===0&&r.pads[1]===0){let D=n[0],M,N,V,Z=[];if(a){let ue=e.kernelCustomData.wT??e.compute(pt(t[1],Ma),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];if(r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=ue),y){let ze=o*u*l;M=t[0].reshape([1,D,ze]),N=ue.reshape([1,ze,m]),V=[1,D,m]}else M=t[0].reshape([D,o*u,l]),N=ue.reshape([1,l,m]),V=[D,h*f,m];Z.push(M),Z.push(N)}else M=t[0].reshape([D,l,o*u]),N=t[1].reshape([1,m,l]),V=[D,m,h*f],Z.push(N),Z.push(M);s&&Z.push(t[2]);let de=V[2],ee=Z[0].dims[Z[0].dims.length-1];de<8&&ee<8?e.compute(bn(Z,r,n,V,a,i),{inputs:Z}):e.compute(Ba(Z,r,n,V,a,i),{inputs:Z});return}let $=!0,_=e.kernelCustomData.wT??e.compute(pt(t[1],Ma),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=_);let w=[t[0],_];s&&w.push(t[2]);let S=a?h*f:m,x=a?m:h*f,C=d*p*l;e.compute(gu(w,r,n,S,x,C,s,$,i),{inputs:w})},Eu=(e,t)=>{let r=t.format==="NHWC",i=[e.inputs[0].reshape(r?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&i.push(e.inputs[2]);let a=[0,t.pads[0],0,t.pads[1]],n=[1].concat(t.strides),s=[1].concat(t.dilations),o=[1].concat(t.kernelShape),u=Da({...t,pads:a,strides:n,dilations:s,kernelShape:o},i);Cn(e,i,u,l=>r?[l[0],l[2],l[3]]:[l[0],l[1],l[3]])},ku=(e,t,r)=>{let i=r.format==="NHWC"?"channelsLast":"channelsFirst",a=Da(r,t),n=r.autoPad==="NOTSET"?r.pads:r.autoPad,s=bu(t[0].dims,t[1].dims,r.strides,r.dilations,n,!1,i);e.compute($u(t,a,s.outShape,[s.filterDepth,s.filterHeight,s.filterWidth],[s.padInfo.front,s.padInfo.top,s.padInfo.left],i))},zn=(e,t)=>{if(Tu(e.inputs,t),e.inputs[0].dims.length===3)Eu(e,t);else if(e.inputs[0].dims.length===5)ku(e,e.inputs,t);else{let r=Da(t,e.inputs);Cn(e,e.inputs,r)}}}),Iu,Oc=I(()=>{pe(),Tt(),ae(),re(),Iu=(e,t,r)=>{let i=e.length>2,a=t.outputShape,n=t.format==="NHWC",s=t.group,o=e[1].dims,u=o[2]/s,l=o[3],d=n?O(u):1,p=n&&l===1&&u>=4,h=p?Math.floor(u/4)*4:Math.floor(u/d)*d,f=u-h,m=n?O(l):1,y=n?l===1?d:m:1,$=U.size(a)/m,_=[Math.ceil($/64),1,1];Te("verbose",()=>`[conv2d_backprop_webgpu] dispatch = ${_}`);let w=["rank","rank"],S=[t.strides[0],t.strides[1]],x=[t.kernelShape[n?1:2],t.kernelShape[n?2:3]],C=[t.dilations[0],t.dilations[1]],D=[x[0]+(t.dilations[0]<=1?0:(t.kernelShape[n?1:2]-1)*(t.dilations[0]-1)),x[1]+(t.dilations[1]<=1?0:(t.kernelShape[n?2:3]-1)*(t.dilations[1]-1))],M=[D[0]-1-Math.floor((t.pads[0]+t.pads[2])/2),D[1]-1-Math.floor((t.pads[1]+t.pads[3])/2)],N=[{type:12,data:$},{type:12,data:S},{type:12,data:x},{type:12,data:C},{type:12,data:D},{type:6,data:M},{type:12,data:h},{type:12,data:u},{type:12,data:l},...E(e[0].dims,e[1].dims)];i&&(N.push(...E(e[2].dims)),w.push("rank")),N.push(...E(a));let V=Z=>{let de=[{name:"output_size",type:"u32"},{name:"strides",type:"u32",length:S.length},{name:"filter_dims",type:"u32",length:x.length},{name:"dilations",type:"u32",length:x.length},{name:"effective_filter_dims",type:"u32",length:D.length},{name:"pads",type:"i32",length:M.length},{name:"input_channels_per_group_int",type:"u32"},{name:"input_channels_per_group",type:"u32"},{name:"output_channels_per_group",type:"u32"}],ee=A(e[0].dataType),ue=n?1:2,ze=n?2:3,be=n?3:1,ne=z("W",e[1].dataType,e[1].dims.length,y),ve=z("Dy",e[0].dataType,e[0].dims.length,d),ie=[ve,ne];i&&ie.push(z("bias",e[2].dataType,[a[be]].length,m));let fe=H("result",e[0].dataType,a.length,m),st=()=>{let se="";if(p)d===4?se+=`
        let xValue = ${ve.getByOffset("x_offset")};
        let wValue = ${ne.getByOffset("w_offset")};
        dotProd = dotProd + dot(xValue, wValue);
        x_offset += 1u;
        w_offset += 1u;`:d===2?se+=`
          dotProd = dotProd + dot(vec4<${ee}>(${ve.getByOffset("x_offset")}, ${ve.getByOffset("x_offset + 1u")}), vec4<${ee}>(${ne.getByOffset("w_offset")}, ${ne.getByOffset("w_offset + 1u")}));
          x_offset += 2u;
          w_offset += 2u;`:d===1&&(se+=`
          dotProd = dotProd + dot(vec4<${ee}>(${ve.getByOffset("x_offset")}, ${ve.getByOffset("x_offset + 1u")}, ${ve.getByOffset("x_offset + 2u")}, ${ve.getByOffset("x_offset + 3u")}), vec4<${ee}>(${ne.getByOffset("w_offset")}, ${ne.getByOffset("w_offset + 1u")}, ${ne.getByOffset("w_offset + 2u")}, ${ne.getByOffset("w_offset + 3u")}));
          x_offset += 4u;
          w_offset += 4u;`);else if(se+=`
                  let xValue = ${n?ve.getByOffset(`${ve.indicesToOffset(`${ve.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${d}`):ve.get("batch","inputChannel","idyR","idyC")};
        `,d===1)se+=`
          let w_offset = ${ne.indicesToOffset(`${ne.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel, wOutChannel)`)};
          let wValue = ${ne.getByOffset(`w_offset / ${y}`)};
          dotProd = dotProd + xValue * wValue;`;else for(let xe=0;xe<d;xe++)se+=`
            let wValue${xe} = ${ne.getByOffset(`${ne.indicesToOffset(`${ne.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel + ${xe}, wOutChannel)`)} / ${y}`)};
            dotProd = dotProd + xValue[${xe}] * wValue${xe};`;return se},W=()=>{if(f===0)return"";if(!p)throw new Error(`packInputAs4 ${p} is not true.`);let se="";if(d===1){se+="dotProd = dotProd";for(let xe=0;xe<f;xe++)se+=`
            + ${ve.getByOffset(`x_offset + ${xe}`)} * ${ne.getByOffset(`w_offset + ${xe}`)}`;se+=";"}else if(d===2){if(f!==2)throw new Error(`Invalid inputChannelsRemainder ${f}.`);se+=`
          let xValue = ${ve.getByOffset("x_offset")};
          let wValue = ${ne.getByOffset("w_offset")};
          dotProd = dotProd + dot(xValue, wValue);`}return se},X=`
            let outputIndices = ${fe.offsetToIndices(`global_idx * ${m}`)};
            let batch = ${fe.indicesGet("outputIndices",0)};
            let d1 = ${fe.indicesGet("outputIndices",be)};
            let r = ${fe.indicesGet("outputIndices",ue)};
            let c = ${fe.indicesGet("outputIndices",ze)};
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
              let dyR = (${ee}(dyRCorner) + ${ee}(wR)) / ${ee}(uniforms.strides[0]);
              let wRPerm = uniforms.filter_dims.x - 1 - wR / uniforms.dilations.x;
              if (dyR < 0.0 || dyR >= ${ee}(uniforms.Dy_shape[${ue}]) || fract(dyR) > 0.0 ||
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
                let dyC = (${ee}(dyCCorner) + ${ee}(wC)) / ${ee}(uniforms.strides.y);
                let wCPerm = uniforms.filter_dims.y - 1 - wC / uniforms.dilations.y;
                if (dyC < 0.0 || dyC >= ${ee}(uniforms.Dy_shape[${ze}]) ||
                    fract(dyC) > 0.0 || wCPerm < 0) {
                  continue;
                }
                let idyC: u32 = u32(dyC);
                var inputChannel = groupId * uniforms.input_channels_per_group;
                ${p?`
                var x_offset = ${ve.indicesToOffset(`${ve.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${d};
                var w_offset = ${ne.indicesToOffset(`${ne.type.indices}(wRPerm, wCPerm, inputChannel, wOutChannel)`)} / ${y};
                  `:""}
                for (var d2: u32 = 0; d2 < uniforms.input_channels_per_group_int; d2 = d2 + ${p?4:d}) {
                  ${st()}
                  inputChannel = inputChannel + ${p?4:d};
                }
                ${W()}
                wC = wC + uniforms.strides.y - 1;
              }
              wR = wR + uniforms.strides[0] - 1;
            }
            let value = dotProd${i?` + bias[d1 / ${m}]`:""};
            ${fe.setByOffset("global_idx","value")};
          `;return`
    ${Z.registerUniforms(de).declareVariables(...ie,fe)}
      ${Z.mainStart()}
      ${Z.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")};
    ${X}}`};return{name:"ConvTranspose2D",shaderCache:{hint:`${t.cacheKey};${d}${y}${m}${p}${f}`,inputDependencies:w},getRunData:()=>({dispatchGroup:{x:_[0],y:_[1],z:_[2]},outputs:[{dims:r?r(a):a,dataType:e[0].dataType}],programUniforms:N}),getShaderSource:V}}}),Cu,zu,Au,An,Ou,Ru,On,Bu,Mu,Rc=I(()=>{Oc(),Qr(),it(),Cu=(e,t,r,i,a,n)=>(e-1)*t+r+(i-1)*a+1-n,zu=(e,t,r,i,a)=>{let n=Math.floor(e/2);t==="SAME_UPPER"?(r[i]=n,r[a]=e-n):t==="SAME_LOWER"&&(r[i]=e-n,r[a]=n)},Au=(e,t,r,i,a,n,s,o,u,l)=>{let d=e.length-2,p=l.length===0;u.length<d&&u.push(...Array(d-u.length).fill(0));let h=e[0],f=t[o?3:1]*a;for(let m=0,y=e.length-d-(o?1:0);m<d;++m,++y){let $=e[y],_=p?$*s[m]:l[m],w=Cu($,s[m],n[m],t[y],r[m],_);zu(w,i,n,m,m+d),p&&l.push(s[m]*($-1)+u[m]+(t[y]-1)*r[m]+1-n[m]-n[m+d])}l.splice(0,0,h),l.splice(o?3:1,0,f)},An=(e,t)=>{let r=e.kernelShape.slice();if(e.kernelShape.length===0||e.kernelShape.reduce((p,h)=>p*h,1)===0){r.length=0;for(let p=2;p<t[1].dims.length;++p)r.push(t[1].dims[p])}let i=e.format==="NHWC";r.splice(0,0,t[1].dims[0]),r.splice(i?3:1,0,t[1].dims[1]);let a=e.pads.slice(),n=e.outputShape.slice(),s=e.outputPadding.slice(),o=t[0].dims,u=e.dilations.slice();if(u.reduce((p,h)=>p+h,0)===0){let p=t[0].dims.length-2;u=new Array(p).fill(1)}let l=e.strides.slice();if(l.reduce((p,h)=>p+h,0)===0){let p=t[0].dims.length-2;l=new Array(p).fill(1)}Au(o,r,u,e.autoPad,e.group,a,l,i,s,n);let d=Object.assign({},e);return Object.assign(d,{kernelShape:r,pads:a,outputPadding:s,outputShape:n,dilations:u,strides:l}),d},Ou=e=>{let t=wn(e),r=e.format,i=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][typeof e.autoPad>"u"?0:e.autoPad],a=e.dilations,n=e.group,s=e.kernelShape,o=e.pads,u=e.strides,l=e.wIsConst(),d=e.outputPadding,p=e.outputShape;return{autoPad:i,format:r,dilations:a,group:n,kernelShape:s,outputPadding:d,outputShape:p,pads:o,strides:u,wIsConst:l,...t,cacheKey:`${e.format};${t.activation};`}},Ru=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length!==4&&e[0].dims.length!==3)throw new Error("currently only support 2-dimensional conv");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let r=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],i=e[1].dims[0];if(r!==i)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");let a=e[1].dims[1]*t.group;if(e.length===3&&(e[2].dims.length!==1||e[2].dims[0]!==a))throw new Error("invalid bias");let n=e[0].dims.length-2;if(t.dilations.reduce((s,o)=>s+o,0)>0&&t.dilations.length!==n)throw new Error(`dilations should be ${n}D`);if(t.strides.reduce((s,o)=>s+o,0)>0&&t.strides.length!==n)throw new Error(`strides should be ${n}D`);if(t.pads.reduce((s,o)=>s+o,0)>0&&t.pads.length!==n*2)throw new Error(`pads should be ${n*2}D`);if(t.outputPadding.length!==n&&t.outputPadding.length!==0)throw new Error(`output_padding should be ${n}D`);if(t.kernelShape.reduce((s,o)=>s+o,0)>0&&t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape");if(t.outputShape.length!==0&&t.outputShape.length!==e[0].dims.length-2)throw new Error("invalid output shape")},On=(e,t,r,i)=>{let a=e.kernelCustomData.wT??e.compute(pt(t[1],[2,3,0,1]),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=a);let n=[t[0],a];t.length===3&&n.push(t[2]),e.compute(Iu(n,r,i),{inputs:n})},Bu=(e,t)=>{let r=t.format==="NHWC",i=[e.inputs[0].reshape(r?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&i.push(e.inputs[2]);let a=t.kernelShape;(a.length===0||a[0]===0)&&(a=[e.inputs[1].dims[2]]);let n=t.dilations;(n.length===0||n[0]===0)&&(n=[1]);let s=t.strides;(s.length===0||s[0]===0)&&(s=[1]);let o=t.pads;o.length===0&&(o=[0,0]),o=[0,o[0],0,o[1]],s=[1].concat(s),n=[1].concat(n),a=[1].concat(a);let u=t.outputPadding;u=[0].concat(u);let l=An({...t,pads:o,strides:s,dilations:n,kernelShape:a,outputPadding:u},i);On(e,i,l,d=>r?[d[0],d[2],d[3]]:[d[0],d[1],d[3]])},Mu=(e,t)=>{if(Ru(e.inputs,t),e.inputs[0].dims.length===3)Bu(e,t);else{let r=An(t,e.inputs);On(e,e.inputs,r)}}}),Du,Pu,Uu,Bc=I(()=>{pe(),ae(),b(),re(),Du=(e,t,r,i)=>{let a=U.size(t),n=t.length,s=z("input",e,n),o=H("output",e,n),u=r.dataType===6?r.getInt32Array()[0]:Number(r.getBigInt64Array()[0]),l=U.normalizeAxis(u,n),d=p=>{let h=` i32(${s.indicesGet("inputIndices","uniforms.axis")}) `,f=P("uniforms.input_shape","uniforms.axis",n),m=i.reverse?h+(i.exclusive?" + 1":""):"0",y=i.reverse?f:h+(i.exclusive?"":" + 1");return`
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
                }`};return{name:"CumSum",shaderCache:{hint:i.cacheKey,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:t,dataType:e}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:[{type:12,data:a},{type:12,data:l},...E(t,t)]}),getShaderSource:d}},Pu=(e,t)=>{let r=e.inputs[0].dims,i=e.inputs[0].dataType,a=e.inputs[1];e.compute(Du(i,r,a,t),{inputs:[0]})},Uu=e=>{let t=e.exclusive===1,r=e.reverse===1;return g({exclusive:t,reverse:r})}}),Nu,Lu,Vu,Wu,Fu,Mc=I(()=>{pe(),ae(),b(),re(),Nu=e=>{if(!e||e.length!==1)throw new Error("DepthToSpace requires 1 input.");if(e[0].dims.length!==4)throw new Error("DepthToSpace requires 4D input.")},Lu=(e,t,r,i)=>{let a=[];a.push(`fn perm(i: ${i.type.indices}) -> ${r.type.indices} {
    var a: ${r.type.indices};`);for(let n=0;n<t;++n)a.push(r.indicesSet("a",e[n],`i[${n}]`));return a.push("return a;}"),a.join(`
`)},Vu=(e,t)=>{let r,i,a,n,s,o,u=t.format==="NHWC",l=t.blocksize,d=t.mode==="DCR";u?([r,i,a,n]=e.dims,s=d?[r,i,a,l,l,n/l**2]:[r,i,a,n/l**2,l,l],o=d?[0,1,3,2,4,5]:[0,1,4,2,5,3]):([r,i,a,n]=[e.dims[0],e.dims[2],e.dims[3],e.dims[1]],s=d?[r,l,l,n/l**2,i,a]:[r,n/l**2,l,l,i,a],o=d?[0,3,4,1,5,2]:[0,1,4,2,5,3]);let p=e.reshape(s),h=p.dims.length,f=e.dataType,m=z("a",f,h),y=H("output",f,h),$=_=>`
  ${_.registerUniform("output_size","u32").declareVariables(m,y)}

  ${Lu(o,h,m,y)}

  ${_.mainStart()}
    ${_.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${y.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${y.setByOffset("global_idx",m.getByIndices("aIndices"))}
  }`;return{name:"DepthToSpace",shaderCache:{hint:`${e.dims};${t.blocksize};${t.mode}`,inputDependencies:["rank"]},getRunData:_=>{let w=u?[r,i*l,a*l,n/l**2]:[r,n/l**2,i*l,a*l],S=U.size(w),x=p.dims,C=U.sortBasedOnPerm(x,o);return{outputs:[{dims:w,dataType:_[0].dataType}],dispatchGroup:{x:Math.ceil(S/64)},programUniforms:[{type:12,data:S},...E(x,C)]}},getShaderSource:$}},Wu=(e,t)=>{Nu(e.inputs),e.compute(Vu(e.inputs[0],t))},Fu=e=>g({blocksize:e.blocksize,mode:e.mode,format:e.format})}),Pa,ca,Rn,qu,Gu,ju,Hu,Bn,Ku,Zu,Qu,Dc=I(()=>{pe(),ae(),b(),re(),Pa="[a-zA-Z]|\\.\\.\\.",ca="("+Pa+")+",Rn="^"+ca+"$",qu="("+ca+",)*"+ca,Gu="^"+qu+"$",ju=class{constructor(e=-1){this.symbolToIndices=new Map,this.inputIndex=e}addSymbol(e,t){let r=this.symbolToIndices.get(e);r===void 0?r=[t]:r.push(t),this.symbolToIndices.set(e,r)}},Hu=class{constructor(e,t){var a;this.equation=t,this.hasEllipsis=!1,this.symbolToInfo=new Map,this.lhs=new Array,this.outputDims=[];let[r,i]=t.includes("->")?t.split("->",2):[t,""];if(!r.match(RegExp(Gu)))throw new Error("Invalid LHS term");if(r.split(",").forEach((n,s)=>{let o=e[s].dims.slice();if(!n.match(RegExp(Rn)))throw new Error("Invalid LHS term");let u=this.processTerm(n,!0,o,s);this.lhs.push(u)}),i==="")i+=[...this.symbolToInfo.entries()].filter(([n,s])=>s.count===1||n==="...").map(([n])=>n).join("");else if(!i.match(RegExp(ca)))throw new Error("Invalid RHS");(a=i.match(RegExp(Pa,"g")))==null||a.forEach(n=>{if(n==="...")this.outputDims=this.outputDims.concat(this.ellipsisDims);else{let s=this.symbolToInfo.get(n);if(s===void 0)throw new Error("Invalid RHS symbol");this.outputDims.push(s.dimValue)}}),this.rhs=this.processTerm(i,!1,this.outputDims)}addSymbol(e,t,r){let i=this.symbolToInfo.get(e);if(i!==void 0){if(i.dimValue!==t&&i.count!==1)throw new Error("Dimension mismatch");i.count++,i.inputIndices.push(r)}else i={count:1,dimValue:t,inputIndices:[r]};this.symbolToInfo.set(e,i)}processTerm(e,t,r,i=-1){let a=r.length,n=!1,s=[],o=0;if(!e.match(RegExp(Rn))&&!t&&e!=="")throw new Error("Invalid LHS term");let u=e.match(RegExp(Pa,"g")),l=new ju(i);return u==null||u.forEach((d,p)=>{if(d==="..."){if(n)throw new Error("Only one ellipsis is allowed per input term");n=!0;let h=a-u.length+1;if(h<0)throw new Error("Ellipsis out of bounds");if(s=r.slice(o,o+h),this.hasEllipsis){if(this.ellipsisDims.length!==s.length||this.ellipsisDims.toString()!==s.toString())throw new Error("Ellipsis dimensions mismatch")}else if(t)this.hasEllipsis=!0,this.ellipsisDims=s;else throw new Error("Ellipsis must be specified in the LHS");for(let f=0;f<s.length;f++){let m=String.fromCharCode(48+f);l.addSymbol(m,p+f),this.addSymbol(m,r[o++],i)}}else l.addSymbol(d,p+(this.hasEllipsis?this.ellipsisDims.length-1:0)),this.addSymbol(d,r[o++],i)}),l}},Bn=e=>e+"_max",Ku=(e,t,r,i)=>{let a=e.map(l=>l.length).map((l,d)=>z(`input${d}`,t,l)),n=U.size(i),s=H("output",t,i.length),o=[...r.symbolToInfo.keys()].filter(l=>!r.rhs.symbolToIndices.has(l)),u=l=>{let d=[],p="var prod = 1.0;",h="var sum = 0.0;",f="sum += prod;",m=[],y=[],$=[],_=[],w=r.symbolToInfo.size===r.rhs.symbolToIndices.size;r.symbolToInfo.forEach((x,C)=>{var D;if(r.rhs.symbolToIndices.has(C)){let M=(D=r.rhs.symbolToIndices.get(C))==null?void 0:D[0];M!==void 0&&r.lhs.forEach((N,V)=>{if(x.inputIndices.includes(V)){let Z=N.symbolToIndices.get(C);if(Z===void 0)throw new Error("Invalid symbol error");Z.forEach(de=>{d.push(`${a[V].indicesSet(`input${V}Indices`,de,s.indicesGet("outputIndices",M))}`)})}})}else r.lhs.forEach((M,N)=>{if(x.inputIndices.includes(N)){let V=M.symbolToIndices.get(C);if(V===void 0)throw new Error("Invalid symbol error");V.forEach(Z=>{m.push(`${a[N].indicesSet(`input${N}Indices`,Z,`${C}`)}`)}),_.push(`prod *= ${a[N].getByIndices(`input${N}Indices`)};`)}}),y.push(`for(var ${C}: u32 = 0; ${C} < uniforms.${Bn(C)}; ${C}++) {`),$.push("}")});let S=w?[...d,`let sum = ${a.map((x,C)=>x.getByIndices(`input${C}Indices`)).join(" * ")};`]:[...d,h,...y,...m,p,..._,f,...$];return`
            ${l.registerUniforms(o.map(x=>({name:`${Bn(x)}`,type:"u32"}))).registerUniform("outputSize","u32").declareVariables(...a,s)}

            ${l.mainStart()}
            ${l.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
            var outputIndices = ${s.offsetToIndices("global_idx")};
            ${a.map((x,C)=>`var input${C}Indices: ${a[C].type.indices};`).join(`
`)}
            ${S.join(`
`)};
            ${s.setByOffset("global_idx","sum")};
          }`};return{name:"Einsum",shaderCache:{hint:r.equation,inputDependencies:e.map(()=>"rank")},getRunData:()=>{let l=o.filter(p=>r.symbolToInfo.has(p)).map(p=>{var h;return{type:12,data:((h=r.symbolToInfo.get(p))==null?void 0:h.dimValue)||0}});l.push({type:12,data:n});let d=e.map((p,h)=>[...E(p)]).reduce((p,h)=>p.concat(h),l);return d.push(...E(i)),{outputs:[{dims:i,dataType:t}],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:d}},getShaderSource:u}},Zu=(e,t)=>{let r=new Hu(e.inputs,t.equation),i=r.outputDims,a=e.inputs.map((n,s)=>n.dims);e.compute(Ku(a,e.inputs[0].dataType,r,i))},Qu=e=>{let t=e.equation.replace(/\s+/g,"");return g({equation:t})}}),Xu,Mn,Yu,Ju,el,Pc=I(()=>{pe(),ae(),re(),Xu=e=>{if(!e||e.length!==2)throw new Error("Expand requires 2 input.");let t=e[0].dims,r=Array.from(e[1].getBigInt64Array(),Number),i=r.length<t.length?0:r.length-t.length,a=t.length<r.length?0:t.length-r.length;for(;i<r.length&&a<t.length;++i,++a)if(r[i]!==t[a]&&r[i]!==1&&t[a]!==1)throw new Error("Expand requires shape to be broadcastable to input")},Mn=(e,t)=>{let r=e.length-t.length,i=[];for(let a=0;a<r;++a)i.push(e[a]);for(let a=0;a<t.length;++a)i.push(t[a]===1?e[a+r]:t[a]);return i},Yu=(e,t)=>e.length>t.length?Mn(e,t):Mn(t,e),Ju=e=>{let t=e[0].dims,r=Array.from(e[1].getBigInt64Array(),Number),i=Yu(t,r),a=e[0].dataType,n=a===9||U.size(t)===1,s=a===9||t.length>0&&t[t.length-1]%4===0?4:1,o=n||i.length>0&&i[i.length-1]%4===0?4:1,u=Math.ceil(U.size(i)/o),l=p=>{let h=z("input",a,t.length,s),f=H("output",a,i.length,o),m;if(a===9){let y=($,_,w="")=>`
          let outputIndices${_} = ${f.offsetToIndices(`outputOffset + ${_}u`)};
          let offset${_} = ${h.broadcastedIndicesToOffset(`outputIndices${_}`,f)};
          let index${_} = offset${_} / 4u;
          let component${_} = offset${_} % 4u;
          ${$}[${_}] = ${w}(${h.getByOffset(`index${_}`)}[component${_}]);
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
    ${m}`},d=[{type:12,data:u},...E(t,i)];return{name:"Expand",shaderCache:{hint:`${i.length};${s}${o}`,inputDependencies:["rank"]},getShaderSource:l,getRunData:()=>({outputs:[{dims:i,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:d})}},el=e=>{Xu(e.inputs),e.compute(Ju(e.inputs),{inputs:[0]})}}),tl,rl,Uc=I(()=>{pe(),ae(),re(),yn(),tl=e=>{let t=e[0].dataType,r=U.size(e[0].dims),i=U.size(e[1].dims),a=i%4===0,n=s=>{let o=z("x",t,[1],4),u=z("bias",t,[1],4),l=H("y",t,[1],4),d=[{name:"output_vec_size",type:"u32"},{name:"bias_size",type:"u32"}],p=f=>`
      let bias${f}_offset: u32 = (global_idx * 4 + ${f}) % uniforms.bias_size;
      let bias${f} = ${u.getByOffset(`bias${f}_offset / 4`)}[bias${f}_offset % 4];`,h=a?`
      let bias = ${u.getByOffset("global_idx % (uniforms.bias_size / 4)")};`:`${p(0)}${p(1)}${p(2)}${p(3)}
      let bias = ${o.type.value}(bias0, bias1, bias2, bias3);`;return`${s.registerUniforms(d).declareVariables(o,u,l)}

    ${mn(k(t))}

    ${s.mainStart(T)}
      ${s.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_vec_size")}

      let x = ${o.getByOffset("global_idx")};
      ${h}
      let x_in = x + bias;
      ${l.setByOffset("global_idx",gn("x_in"))}
    }`};return{name:"FastGeluWithBias",shaderCache:{hint:`${a}`,inputDependencies:["type","type"]},getShaderSource:n,getRunData:s=>({outputs:[{dims:s[0].dims,dataType:s[0].dataType}],programUniforms:[{type:12,data:Math.ceil(r/4)},{type:12,data:i}],dispatchGroup:{x:Math.ceil(r/T/4)}})}},rl=e=>{e.inputs.length<2||U.size(e.inputs[1].dims)===0?Do(e):e.compute(tl(e.inputs))}}),il,al,nl,sl,Nc=I(()=>{pe(),ae(),b(),re(),il=e=>{if(!e||e.length!==2)throw new Error("Gather requires 2 inputs.")},al=(e,t)=>{let r=e[0].dims,i=e[1].dims,a=r.length,n=U.normalizeAxis(t.axis,a),s=r.slice(0);s.splice(n,1,...i);let o=r[n],u=e[0].dataType===9?4:1,l=Math.ceil(U.size(s)/u),d=[{type:12,data:l},{type:6,data:o},{type:12,data:n},...E(e[0].dims,e[1].dims,s)],p=h=>{let f=z("data",e[0].dataType,e[0].dims.length,u),m=z("inputIndices",e[1].dataType,e[1].dims.length),y=H("output",e[0].dataType,s.length,u),$=w=>{let S=i.length,x=`var indicesIndices${w}  = ${m.type.indices}(0);`;for(let C=0;C<S;C++)x+=`${S>1?`indicesIndices${w}[${C}]`:`indicesIndices${w}`} = ${s.length>1?`outputIndices${w}[uniforms.axis + ${C}]`:`outputIndices${w}`};`;x+=`
          var idx${w} = ${m.getByIndices(`indicesIndices${w}`)};
          if (idx${w} < 0) {
            idx${w} = idx${w} + uniforms.axisDimLimit;
          }
          var dataIndices${w} : ${f.type.indices};
        `;for(let C=0,D=0;C<a;C++)C===n?(x+=`${a>1?`dataIndices${w}[${C}]`:`dataIndices${w}`} = u32(idx${w});`,D+=S):(x+=`${a>1?`dataIndices${w}[${C}]`:`dataIndices${w}`} = ${s.length>1?`outputIndices${w}[${D}]`:`outputIndices${w}`};`,D++);return x},_;if(e[0].dataType===9){let w=(S,x,C="")=>`
          let outputIndices${x} = ${y.offsetToIndices(`outputOffset + ${x}u`)};
          ${$(x)};
          let offset${x} = ${f.indicesToOffset(`dataIndices${x}`)};
          let index${x} = offset${x} / 4u;
          let component${x} = offset${x} % 4u;
          ${S}[${x}] = ${C}(${f.getByOffset(`index${x}`)}[component${x}]);
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
      ${$("")};
      let value = ${f.getByIndices("dataIndices")};
      ${y.setByOffset("global_idx","value")};
      `;return`
      ${h.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(f,m,y)}
      ${h.mainStart()}
        ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        ${_}
      }`};return{name:"Gather",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:s,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:d}),getShaderSource:p}},nl=e=>g({axis:e.axis}),sl=(e,t)=>{let r=e.inputs;il(r),e.compute(al(e.inputs,t))}}),ol,ul,ll,Lc=I(()=>{pe(),ae(),re(),ol=(e,t,r,i,a,n,s,o,u)=>{let l=[{type:12,data:n},{type:12,data:i},{type:12,data:a},{type:12,data:r},{type:12,data:s},{type:12,data:o},{type:12,data:u}],d=[n];l.push(...E(t.dims,d));let p=h=>{let f=z("indices_data",t.dataType,t.dims.length),m=H("input_slice_offsets_data",12,1,1),y=[f,m],$=[{name:"output_size",type:"u32"},{name:"batch_dims",type:"u32"},{name:"input_dims",type:"u32",length:a.length},{name:"sizes_from_slice_dims_data",type:"u32",length:r.length},{name:"num_slices_per_batch",type:"u32"},{name:"input_batch_stride",type:"u32"},{name:"num_slice_dims",type:"u32"}];return`
  ${h.registerUniforms($).declareVariables(...y)}
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
  }`};return e.compute({name:"computeSliceOffsets",shaderCache:{hint:`${a.length}_${r.length}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:d,dataType:e.inputs[1].dataType}],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:l}),getShaderSource:p},{inputs:[t],outputs:[-1]})[0]},ul=(e,t)=>{let r=e.inputs,i=r[0].dims,a=r[0].dataType,n=r[1].dims,s=n[n.length-1],o=U.sizeToDimension(n,n.length-1),u=U.sizeFromDimension(i,t.batchDims+s),l=U.sizeToDimension(i,t.batchDims),d=U.sizeFromDimension(i,t.batchDims),p=o/l,h=new Array(s),f=u;for(let x=0;x<s;++x)h[s-1-x]=f,f*=i[t.batchDims+s-1-x];let m=ol(e,r[1],h,t.batchDims,i,o,p,d,s),y=t.batchDims+s;if(y>i.length)throw new Error("last dimension of indices must not be larger than rank of input tensor");let $=n.slice(0,-1).concat(i.slice(y)),_=U.size($),w=[{type:12,data:_},{type:12,data:u},...E(r[0].dims,m.dims,$)],S=x=>{let C=z("data",r[0].dataType,r[0].dims.length),D=z("slice_offsets",12,m.dims.length),M=H("output",r[0].dataType,$.length);return`
          ${x.registerUniform("output_size","u32").registerUniform("slice_size","u32").declareVariables(C,D,M)}
            ${x.mainStart()}
            ${x.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let slice_offset = slice_offsets[global_idx / uniforms.slice_size];
          output[global_idx] = data[u32(slice_offset) + global_idx % uniforms.slice_size];
        }`};e.compute({name:"GatherND",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:$,dataType:a}],dispatchGroup:{x:Math.ceil(_/64)},programUniforms:w}),getShaderSource:S},{inputs:[r[0],m]})},ll=e=>({batchDims:e.batch_dims,cacheKey:""})}),dl,pl,cl,hl,Vc=I(()=>{pe(),ae(),b(),re(),dl=(e,t)=>{if(e.length<3||e.length>4)throw new Error("GatherBlockQuantized requires 3 or 4 inputs.");let r=U.normalizeAxis(t.quantizeAxis,e[0].dims.length),i=t.blockSize,a=e[0],n=e[2],s=e.length===4?e[3]:void 0;if(n.dims.length!==a.dims.length||!a.dims.map((o,u)=>u===r?Math.ceil(o/i)===n.dims[u]:o===n.dims[u]).reduce((o,u)=>o&&u,!0))throw new Error("Scales must have the same rank as the input tensor and the dims should match except on gatherAxis.");if(s){if(s.dataType!==a.dataType)throw new Error("Zero point must have the same data type as the input tensor.");if(s.dims.length!==n.dims.length||!s.dims.map((o,u)=>o===n.dims[u]).reduce((o,u)=>o&&u,!0))throw new Error("Zero point must have the same rank as the input tensor and the dims should match except on quantizeAxis.")}},pl=(e,t)=>{let r=e[0].dims,i=e[1].dims,a=r.length,n=U.normalizeAxis(t.gatherAxis,a),s=U.normalizeAxis(t.quantizeAxis,a),o=r.slice(0);o.splice(n,1,...i);let u=U.size(o),l=e[2].dataType,d=e[0].dataType===22,p=[{type:12,data:u},{type:12,data:s},{type:12,data:n},{type:12,data:t.blockSize},...E(...e.map((f,m)=>f.dims),o)],h=f=>{let m=z("data",e[0].dataType,e[0].dims.length),y=z("inputIndices",e[1].dataType,e[1].dims.length),$=z("scales",e[2].dataType,e[2].dims.length),_=e.length>3?z("zeroPoint",e[3].dataType,e[3].dims.length):void 0,w=H("output",l,o.length),S=[m,y,$];_&&S.push(_);let x=[{name:"output_size",type:"u32"},{name:"quantize_axis",type:"u32"},{name:"gather_axis",type:"u32"},{name:"block_size",type:"u32"}];return`
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
        let quantize_axis_index = ${$.indicesGet("data_indices","uniforms.quantize_axis")} / uniforms.block_size;
        ${$.indicesSet("scale_indices","uniforms.quantize_axis","quantize_axis_index")};
        var scale = ${$.getByIndices("scale_indices")};
        ${_?`
              let zero_point_indices = scale_indices;
              let zero_point_offset = ${_.indicesToOffset("zero_point_indices")};
              let zero_point_index = zero_point_offset % 8;
              let packed_4bit_zero_points = ${_.getByOffset("zero_point_offset / 8")};
              let packed_8bit_zero_points = (packed_4bit_zero_points >> (4 * (zero_point_index % 2))) & 0x0f0f0f0f;
              let zero_point_vec = ${d?"unpack4xI8":"unpack4xU8"}(u32(packed_8bit_zero_points));
              let zero_point = zero_point_vec[zero_point_index / 2];`:"var zero_point = 0"};
        let dequantized_data = ${k(l)}(quantized_data - zero_point) * scale;
        ${w.setByOffset("global_idx","dequantized_data")};
    }`};return{name:"GatherBlockQuantized",shaderCache:{hint:`${t.cacheKey};${e.filter((f,m)=>m!==1).map(f=>f.dims.join("_")).join(";")}`,inputDependencies:Array.from({length:e.length},(f,m)=>"rank")},getRunData:()=>({outputs:[{dims:o,dataType:l}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:p}),getShaderSource:h}},cl=(e,t)=>{let r=e.inputs;dl(r,t),e.compute(pl(e.inputs,t))},hl=e=>g({blockSize:e.blockSize,gatherAxis:e.gatherAxis,quantizeAxis:e.quantizeAxis})}),fl,ml,gl,yl,Wc=I(()=>{pe(),ae(),b(),re(),fl=e=>{if(!e||e.length!==2)throw new Error("GatherElements requires 2 inputs.");if(e[0].dims.length<1)throw new Error("GatherElements requires that the data input be rank >= 1.");if(e[0].dims.length!==e[1].dims.length)throw new Error(`GatherElements requires that the data input and
                     indices input tensors be of same rank.`)},ml=(e,t)=>{let r=e[0].dims,i=e[0].dataType,a=r.length,n=e[1].dims,s=e[1].dataType,o=U.normalizeAxis(t.axis,a),u=r[o],l=n.slice(0),d=U.size(l),p=z("input",i,a),h=z("indicesInput",s,n.length),f=H("output",i,l.length),m=[{type:12,data:d},{type:6,data:u},{type:12,data:o}];return m.push(...E(r,n,l)),{name:"GatherElements",shaderCache:{inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:l,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:m}),getShaderSource:y=>`
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
  }`}},gl=e=>g({axis:e.axis}),yl=(e,t)=>{let r=e.inputs;fl(r),e.compute(ml(e.inputs,t))}}),wl,_l,bl,$l,Fc=I(()=>{pe(),ae(),re(),wl=e=>{if(!e)throw new Error("Input is missing");if(e.length<2||e.length>3)throw new Error("Invaid input number.");if(e.length===3&&e[2].dims.length>2)throw new Error("Invalid input shape of C");if(e[0].dataType!==e[1].dataType||e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("Input types are mismatched")},_l=(e,t)=>{let r=e[0].dims.slice(),i=e[1].dims.slice(),[a,n,s]=li.getShapeOfGemmResult(r,t.transA,i,t.transB,e.length===3?e[2].dims:void 0),o=[a,n];if(!o)throw new Error("Can't use gemm on the given tensors");let u=16,l=Math.ceil(n/u),d=Math.ceil(a/u),p=!0,h=U.size(o),f=[{type:12,data:p?l:h},{type:12,data:a},{type:12,data:n},{type:12,data:s},{type:1,data:t.alpha},{type:1,data:t.beta}],m=["type","type"];e.length===3&&(f.push(...E(e[2].dims)),m.push("rank")),f.push(...E(o));let y=_=>{let w="";t.transA&&t.transB?w="value += a[k * uniforms.M + m] * b[n * uniforms.K + k];":t.transA&&!t.transB?w="value += a[k * uniforms.M + m] * b[k * uniforms.N + n];":!t.transA&&t.transB?w="value += a[m * uniforms.K + k] * b[n * uniforms.K + k];":!t.transA&&!t.transB&&(w="value += a[m * uniforms.K + k] * b[k * uniforms.N + n];");let S=t.alpha===1?"":"value *= uniforms.alpha;",x=z("a",e[0].dataType,e[0].dims),C=z("b",e[1].dataType,e[1].dims),D=x.type.value,M=null,N=[x,C];e.length===3&&(M=z("c",e[2].dataType,e[2].dims.length),N.push(M));let V=H("output",e[0].dataType,o.length);N.push(V);let Z=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}];return`
  ${_.registerUniforms(Z).declareVariables(...N)}

  ${_.mainStart()}
    ${_.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let m = global_idx / uniforms.N;
    let n = global_idx % uniforms.N;

    var value = ${D}(0);
    for (var k: u32 = 0u; k < uniforms.K; k++) {
      ${w}
    }

    ${S}
    ${M!=null?`let cOffset = ${M.broadcastedIndicesToOffset("vec2(m, n)",V)}; value += ${D}(uniforms.beta) * ${M.getByOffset("cOffset")};`:""}
    output[global_idx] = value;
  }`},$=_=>{let w=z("a",e[0].dataType,e[0].dims),S=z("b",e[1].dataType,e[1].dims),x=null,C=[w,S];e.length===3&&(x=z("c",e[2].dataType,e[2].dims.length),C.push(x));let D=H("output",e[0].dataType,o.length);C.push(D);let M=[{name:"num_tile_n",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}],N="",V="";t.transA&&t.transB?(V=`
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
      `,N="value += tile_a[k][local_id.y] * tile_b[local_id.x][k];"):t.transA&&!t.transB?(V=`
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
      `,N="value += tile_a[k][local_id.y] * tile_b[k][local_id.x];"):!t.transA&&t.transB?(V=`
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
      `,N="value += tile_a[local_id.y][k] * tile_b[local_id.x][k];"):!t.transA&&!t.transB&&(V=`
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
      `,N="value += tile_a[local_id.y][k] * tile_b[k][local_id.x];");let Z=t.alpha===1?"":"value *= uniforms.alpha;";return`
  ${_.registerUniforms(M).declareVariables(...C)}
  var<workgroup> tile_a: array<array<${w.type.storage}, ${u}>, ${u}>;
  var<workgroup> tile_b: array<array<${S.type.storage}, ${u}>, ${u}>;
  ${_.mainStart([u,u,1])}
    let tile_col_start = (workgroup_index % uniforms.num_tile_n) * ${u};
    let tile_row_start = (workgroup_index / uniforms.num_tile_n) * ${u};
    let num_tiles = (uniforms.K - 1) / ${u} + 1;
    var k_start = 0u;
    var value = ${D.type.value}(0);
    for (var t: u32 = 0u; t < num_tiles; t++) {
      ${V}
      k_start = k_start + ${u};
      workgroupBarrier();

      for (var k: u32 = 0u; k < ${u}; k++) {
        ${N}
      }
      workgroupBarrier();
    }

    ${Z}
    let m = tile_row_start + local_id.y;
    let n = tile_col_start + local_id.x;
    ${x!=null?`let cOffset = ${x.broadcastedIndicesToOffset("vec2(m, n)",D)}; value += ${D.type.value}(uniforms.beta) * ${x.getByOffset("cOffset")};`:""}
    if (m < uniforms.M && n < uniforms.N) {
      output[m * uniforms.N + n] = value;
    }
  }`};return p?{name:"GemmShared",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:o,dataType:e[0].dataType}],dispatchGroup:{x:l*d},programUniforms:f}),getShaderSource:$}:{name:"Gemm",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:o,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(h/64)},programUniforms:f}),getShaderSource:y}},bl=e=>{let t=e.transA,r=e.transB,i=e.alpha,a=e.beta;return{transA:t,transB:r,alpha:i,beta:a,cacheKey:`${e.transA};${e.transB};${e.alpha===1}`}},$l=(e,t)=>{wl(e.inputs),e.compute(_l(e.inputs,t))}}),Qt,ir,Xr,Yr,vl,xl,Sl,Tl,El,kl,Il,Cl,zl,Al,qc=I(()=>{pe(),ae(),b(),re(),[Qt,ir,Xr,Yr]=[0,1,2,3],vl=e=>{if(e[0].dims.length!==4)throw new Error("only 4-D tensor is supported.");if(e[0].dims.length!==e[1].dims.length)throw new Error("input dimensions must be equal to grid dimensions");if(e[0].dims.length-2!==e[1].dims[e[1].dims.length-1])throw new Error(`last dimension of grid must be equal to ${e[0].dims.length-2}`);if(e[0].dims[0]!==e[1].dims[0])throw new Error("grid batch size must match input batch size")},xl=`
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
`,Sl=e=>`
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
`,Tl=e=>`
  fn gs_denormalize(n: f32, length: i32) -> f32 {
    ${e.alignCorners===0?`
    // alignCorners: false => [-1, 1] to [-0.5, length - 0.5]
    return ((n + 1.0) * f32(length) - 1.0) / 2.0;
    `:`
    // alignCorners: true => [-1, 1] to [0, length - 1]
    return (n + 1.0) / 2.0 * (f32(length - 1));
    `}
  }
`,El=e=>`
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
`,kl=(e,t,r)=>`
  fn pixel_at_grid(r: i32, c: i32, H: i32, W: i32, batch: u32, channel: u32, border: vec4<f32>) -> ${t} {
     var pixel = ${t}(0);
     var indices = vec4<u32>(0);
     indices[${Qt}] = batch;
     indices[${ir}] = channel;`+(()=>{switch(r.paddingMode){case"zeros":return`
          if (r >= 0 && r < H && c >=0 && c < W) {
            indices[${Xr}] = u32(r);
            indices[${Yr}] = u32(c);
          } else {
            return ${t}(0);
          }
        `;case"border":return`
          indices[${Xr}] = u32(clamp(r, 0, H - 1));
          indices[${Yr}] = u32(clamp(c, 0, W - 1));
        `;case"reflection":return`
          indices[${Xr}] = gs_reflect(r, border[1], border[3]);
          indices[${Yr}] = gs_reflect(c, border[0], border[2]);
        `;default:throw new Error(`padding mode ${r.paddingMode} is not supported`)}})()+`
    return ${e.getByIndices("indices")};
  }
`,Il=(e,t,r)=>(()=>{switch(r.mode){case"nearest":return`
          let result = pixel_at_grid(i32(round(y)), i32(round(x)), H_in, W_in, indices[${Qt}], indices[${ir}], border);
        `;case"bilinear":return`
          let x1 = i32(floor(x));
          let y1 = i32(floor(y));
          let x2 = x1 + 1;
          let y2 = y1 + 1;

          let p11 = pixel_at_grid(y1, x1, H_in, W_in, indices[${Qt}], indices[${ir}], border);
          let p12 = pixel_at_grid(y1, x2, H_in, W_in, indices[${Qt}], indices[${ir}], border);
          let p21 = pixel_at_grid(y2, x1, H_in, W_in, indices[${Qt}], indices[${ir}], border);
          let p22 = pixel_at_grid(y2, x2, H_in, W_in, indices[${Qt}], indices[${ir}], border);

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
              p[h][w] = pixel_at_grid(h + y0, w + x0, H_in, W_in, indices[${Qt}], indices[${ir}], border);
            }
          }

          let dx = x - f32(x0 + 1);
          let dy = y - f32(y0 + 1);
          let result = gs_bicubic_interpolate(p, dx, dy);
        `;default:throw new Error(`mode ${r.mode} is not supported`)}})()+`${e.setByOffset("global_idx","result")}`,Cl=(e,t)=>{let r=z("x",e[0].dataType,e[0].dims.length),i=[e[1].dims[0],e[1].dims[1],e[1].dims[2]],a=z("grid",e[1].dataType,i.length,2),n=[e[0].dims[0],e[0].dims[1],e[1].dims[1],e[1].dims[2]];t.format==="NHWC"&&(n=[e[0].dims[0],e[1].dims[1],e[1].dims[2],e[0].dims[3]],[Qt,ir,Xr,Yr]=[0,3,1,2]);let s=H("output",e[0].dataType,n.length),o=r.type.value,u=U.size(n),l=[{type:12,data:u},...E(e[0].dims,i,n)],d=p=>`
  ${p.registerUniform("output_size","u32").declareVariables(r,a,s)}
  ${xl}
  ${Sl(o)}
  ${Tl(t)}
  ${El(t)}
  ${kl(r,o,t)}

  ${p.mainStart()}
    ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let H_in = i32(uniforms.x_shape[${Xr}]);
      let W_in = i32(uniforms.x_shape[${Yr}]);

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
      var grid_indices = vec3<u32>(indices[${Qt}], indices[${Xr}], indices[${Yr}]);
      let nxy = ${a.getByIndices("grid_indices")};
      var x = gs_denormalize(f32(nxy[0]), W_in);
      var y = gs_denormalize(f32(nxy[1]), H_in);

      ${Il(s,o,t)}
  }`;return{name:"GridSample",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:["type","type"]},getRunData:p=>{let h=U.size(n);return{outputs:[{dims:n,dataType:p[0].dataType}],dispatchGroup:{x:Math.ceil(h/64)},programUniforms:l}},getShaderSource:d}},zl=(e,t)=>{vl(e.inputs),e.compute(Cl(e.inputs,t))},Al=e=>g({alignCorners:e.align_corners,mode:e.mode,paddingMode:e.padding_mode,format:e.format})}),gt,Ol,Rl,Dn,Bl,ha,Ml,Dl=I(()=>{pe(),ae(),b(),hi(),hn(),re(),it(),gt=(e,t)=>e.length>t&&e[t].dims.length>0?e[t]:void 0,Ol=(e,t)=>{let r=e[0],i=gt(e,1),a=gt(e,2),n=gt(e,3),s=gt(e,4),o=gt(e,5),u=gt(e,6),l=gt(e,7);if(r.dims.length!==3&&r.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let d=r.dims[0],p=r.dims[1],h=r.dims.length===3?r.dims[2]:t.numHeads*r.dims[4],f=p,m=0,y=0,$=Math.floor(h/t.numHeads);if(u&&l&&U.size(u.dims)&&U.size(l.dims)){if(u.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(u.dims[0]!==d||u.dims[1]!==t.numHeads||u.dims[3]!==$)throw new Error('Input "past_key" shape (batch_size, num_heads, past_sequence_length, head_size)');if(l.dims[0]!==d||l.dims[1]!==t.numHeads||l.dims[3]!==$)throw new Error('Input "past_value" shape (batch_size, num_heads, past_sequence_length, head_size)');if(u.dims[2]!==l.dims[2])throw new Error('Input "past_key" and "past_value" shall have same dim 2 (past_sequence_length)');if(l.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');m=u.dims[2],y=u.dims[2]}else if(u&&U.size(u.dims)||l&&U.size(l.dims))throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let _;if(i&&U.size(i.dims)>0){if(r.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(i.dims.length<3||i.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(r.dims[0]!==i.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(i.dims.length===3){if(i.dims[2]!==r.dims[2])throw new Error('Input "query" and "key" shall have same dim 2 (hidden_size)');_=2,f=i.dims[1]}else if(i.dims.length===5){if(i.dims[2]!==t.numHeads||i.dims[3]!==2||i.dims[4]!==$)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(a)throw new Error('Expect "value" be none when "key" has packed kv format.');_=5,f=i.dims[1]}else{if(i.dims[1]!==t.numHeads||i.dims[3]!==$)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');_=0,f=i.dims[2]}}else{if(r.dims.length!==5)throw new Error('Input "query" is expected to have 5 dimensions when key is empty');if(r.dims[2]!==t.numHeads||r.dims[3]!==3)throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');_=3}if(n&&U.size(n.dims)>0){if(n.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimension');if(i&&i.dims.length===5&&i.dims[3]===2)throw new Error("bias is not allowed for packed kv.")}let w=m+f,S=0;if(s&&U.size(s.dims)>0){S=8;let M=s.dims;throw M.length===1?M[0]===d?S=1:M[0]===3*d+2&&(S=3):M.length===2&&M[0]===d&&M[1]===w&&(S=5),S===8?new Error('Input "key_padding_mask" shape shall be (batch_size) or (batch_size, total_sequence_length)'):new Error("Mask not supported")}let x=!1,C=h;if(a&&U.size(a.dims)>0){if(a.dims.length!==3&&a.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(r.dims[0]!==a.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(a.dims.length===3){if(f!==a.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');C=a.dims[2]}else{if(f!==a.dims[2])throw new Error('Input "key" and "value" shall have the same dim 2 (kv_sequence_length)');C=a.dims[1]*a.dims[3],x=!0}}let D=!1;if(s&&U.size(s.dims)>0)throw new Error("Key padding mask is not supported");if(o&&U.size(o.dims)>0){if(o.dims.length!==4)throw new Error('Input "attention_bias" is expected to have 4 dimensions');if(o.dims[0]!==d||o.dims[1]!==t.numHeads||o.dims[2]!==p||o.dims[3]!==w)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:d,sequenceLength:p,pastSequenceLength:m,kvSequenceLength:f,totalSequenceLength:w,maxSequenceLength:y,inputHiddenSize:0,hiddenSize:h,vHiddenSize:C,headSize:$,vHeadSize:Math.floor(C/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:S,scale:t.scale,broadcastResPosBias:D,passPastInKv:x,qkvFormat:_}},Rl=e=>g({...e}),Dn=g({perm:[0,2,1,3]}),Bl=(e,t,r,i,a,n,s)=>{let o=[i,a,n],u=U.size(o),l=[{type:12,data:u},{type:12,data:s},{type:12,data:n}],d=p=>{let h=H("qkv_with_bias",t.dataType,o),f=z("qkv",t.dataType,o),m=z("bias",r.dataType,o),y=[{name:"output_size",type:"u32"},{name:"bias_offset",type:"u32"},{name:"hidden_size",type:"u32"}];return`
  ${p.registerUniforms(y).declareVariables(f,m,h)}
  ${p.mainStart()}
    ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let bias_offset_idx = (global_idx % uniforms.hidden_size) + uniforms.bias_offset;

    qkv_with_bias[global_idx] = qkv[global_idx] + bias[bias_offset_idx];
  }`};return e.compute({name:"MultiHeadAttentionAddBias",shaderCache:{inputDependencies:["type","type"]},getRunData:()=>({outputs:[{dims:o,dataType:t.dataType,gpuDataType:0}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:l}),getShaderSource:d},{inputs:[t,r],outputs:[-1]})[0]},ha=(e,t,r,i,a,n,s,o)=>{let u=n;if(s&&U.size(s.dims)>0){if(i===1)throw new Error("AddBiasReshape is not implemented. Please export your model with packed QKV or KV");return u=Bl(e,n,s,t,i,r*a,o),u=u.reshape([t,i,r,a]),r===1||i===1?u:e.compute(pt(u,Dn.perm),{inputs:[u],outputs:[-1]})[0]}else return n.dims.length===3&&(u=n.reshape([t,i,r,a])),r===1||i===1?u:e.compute(pt(u,Dn.perm),{inputs:[u],outputs:[-1]})[0]},Ml=(e,t)=>{let r=Ol(e.inputs,t),i=e.inputs[0],a=gt(e.inputs,1),n=gt(e.inputs,2),s=gt(e.inputs,3),o=gt(e.inputs,4),u=gt(e.inputs,5),l=gt(e.inputs,6),d=gt(e.inputs,7);if(i.dims.length===5)throw new Error("Packed QKV is not implemented");if((a==null?void 0:a.dims.length)===5)throw new Error("Packed KV is not implemented");let p=a&&n&&a.dims.length===4&&n.dims.length===4,h=ha(e,r.batchSize,r.numHeads,r.sequenceLength,r.headSize,i,s,0);if(p)return ua(e,h,a,n,o,void 0,l,d,u,r);if(!a||!n)throw new Error("key and value must be provided");let f=ha(e,r.batchSize,r.numHeads,r.kvSequenceLength,r.headSize,a,s,r.hiddenSize),m=ha(e,r.batchSize,r.numHeads,r.kvSequenceLength,r.vHeadSize,n,s,2*r.hiddenSize);ua(e,h,f,m,o,void 0,l,d,u,r)}}),Pl,Ul,Nl,Ll,Pn,Vl,Wl,Fl=I(()=>{pe(),ae(),b(),re(),Pl=e=>{if(!e||e.length<1)throw new Error("too few inputs")},Ul=(e,t)=>{let r=[],i=t.numOutputs;return e[1].dims[0]>0&&(e[1].getBigInt64Array().forEach(a=>r.push(Number(a))),i=r.length),g({numOutputs:i,axis:t.axis,splitSizes:r})},Nl=e=>`
fn calculateOutputIndex(index: u32) -> u32 {
    for (var i: u32 = 0u; i < ${e}u; i += 1u ) {
    if (index < ${P("uniforms.size_in_split_axis","i",e)}) {
        return i;
    }
    }
    return ${e}u;
}`,Ll=e=>{let t=e.length,r=[];for(let i=0;i<t;++i){let a=e[i].setByIndices("indices","input[global_idx]");t===1?r.push(a):i===0?r.push(`if (output_number == ${i}u) { ${a} }`):i===t-1?r.push(`else { ${a} }`):r.push(`else if (output_number == ${i}) { ${a} }`)}return`
      fn writeBufferData(output_number: u32, indices: ${e[0].type.indices}, global_idx: u32) {
        ${r.join(`
`)}
      }`},Pn=(e,t)=>{let r=e[0].dims,i=U.size(r),a=e[0].dataType,n=U.normalizeAxis(t.axis,r.length),s=new Array(t.numOutputs),o=z("input",a,r.length),u=new Array(t.numOutputs),l=[],d=[],p=0,h=[{type:12,data:i}];for(let m=0;m<t.numOutputs;m++){p+=t.splitSizes[m],u[m]=p;let y=r.slice();y[n]=t.splitSizes[m],d.push(y),s[m]=H(`output${m}`,a,y.length),l.push({dims:d[m],dataType:e[0].dataType})}h.push({type:12,data:u},...E(r,...d));let f=m=>`
  ${m.registerUniform("input_size","u32").registerUniform("size_in_split_axis","u32",u.length).declareVariables(o,...s)}
  ${Nl(u.length)}
  ${Ll(s)}

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
  }`;return{name:"Split",shaderCache:{hint:t.cacheKey,inputDependencies:["rank"]},getShaderSource:f,getRunData:()=>({outputs:l,dispatchGroup:{x:Math.ceil(i/64)},programUniforms:h})}},Vl=(e,t)=>{Pl(e.inputs);let r=e.inputs.length===1?t:Ul(e.inputs,t);e.compute(Pn(e.inputs,r),{inputs:[0]})},Wl=e=>{let t=e.axis,r=e.splitSizes,i=e.numOutputs<0?r.length:e.numOutputs;if(i!==r.length)throw new Error("numOutputs and splitSizes length must be equal");return g({axis:t,numOutputs:i,splitSizes:r})}}),ql,Ua,Gl,jl=I(()=>{pe(),ae(),b(),re(),ql=(e,t)=>{let[r,i,a,n]=e,{numHeads:s,rotaryEmbeddingDim:o}=t;if(r.dims.length!==3&&r.dims.length!==4)throw new Error(`Input 'x' is expected to have 3 or 4 dimensions, got ${r.dims.length}`);if(!U.areEqual(i.dims,[])&&!U.areEqual(i.dims,[1])&&i.dims.length!==2)throw new Error(`Input 'position_ids' is expected to have 0, 1, or 2 dimensions, got ${i.dims.length}`);if(a.dims.length!==2)throw new Error(`Input 'cos_cache' is expected to have 2 dimensions, got ${a.dims.length}`);if(n.dims.length!==2)throw new Error(`Input 'sin_cache' is expected to have 2 dimensions, got ${n.dims.length}`);if(!U.areEqual(a.dims,n.dims))throw new Error("Inputs 'cos_cache' and 'sin_cache' are expected to have the same shape");if(o>0&&s===0)throw new Error("num_heads must be provided if rotary_embedding_dim is specified");let u=r.dims[0],l=r.dims[r.dims.length-2],d=a.dims[0],p=U.sizeFromDimension(r.dims,1)/l,h=o===0?a.dims[1]*2:p/s;if(o>h)throw new Error("rotary_embedding_dim must be less than or equal to head_size");if(i.dims.length===2){if(u!==i.dims[0])throw new Error(`Input 'position_ids' dimension 0 should be of size batch_size, got ${i.dims[0]}`);if(l!==i.dims[1])throw new Error(`Input 'position_ids' dimension 1 should be of size sequence_length, got ${i.dims[1]}`)}if(h/2!==a.dims[1]&&o/2!==a.dims[1])throw new Error(`Input 'cos_cache' dimension 1 should be same as head_size / 2 or rotary_embedding_dim / 2, got ${a.dims[1]}`);if(l>d)throw new Error("Updating cos_cache and sin_cache in RotaryEmbedding is not currently supported")},Ua=(e,t)=>{let{interleaved:r,numHeads:i,rotaryEmbeddingDim:a,scale:n}=t,s=e[0].dims[0],o=U.sizeFromDimension(e[0].dims,1),u=e[0].dims[e[0].dims.length-2],l=o/u,d=e[2].dims[1],p=a===0?d*2:l/i,h=new Array(s,u,l/p,p-d),f=U.computeStrides(h),m=[{type:1,data:n},{type:12,data:h},{type:12,data:f},...e[0].dims.length===3?new Array({type:12,data:[o,l,p,1]}):[],...e[0].dims.length===4?new Array({type:12,data:[o,p,u*p,1]}):[],...E(e[0].dims,e[1].dims,e[2].dims,e[3].dims,e[0].dims)],y=$=>{let _=z("input",e[0].dataType,e[0].dims.length),w=z("position_ids",e[1].dataType,e[1].dims.length),S=z("cos_cache",e[2].dataType,e[2].dims.length),x=z("sin_cache",e[3].dataType,e[3].dims.length),C=H("output",e[0].dataType,e[0].dims.length);return $.registerUniforms([{name:"scale",type:"f32"},{name:"global_shape",type:"u32",length:h.length},{name:"global_strides",type:"u32",length:f.length},{name:"input_output_strides",type:"u32",length:f.length}]),`
        ${$.declareVariables(_,w,S,x,C)}

        ${$.mainStart(T)}
          let half_rotary_emb_dim = uniforms.${S.name}_shape[1];
          let bsnh = global_idx / uniforms.global_strides % uniforms.global_shape;
          let size = uniforms.global_shape[0] * uniforms.global_strides[0];
          ${$.guardAgainstOutOfBoundsWorkgroupSizes("size")}

          if (bsnh[3] < half_rotary_emb_dim) {
            let position_ids_idx =
                ${w.broadcastedIndicesToOffset("bsnh.xy",H("",w.type.tensor,2))};
            let position_id =
                u32(${w.getByOffset("position_ids_idx")}) + select(0, bsnh[1], position_ids_idx == 0);
            let i = dot(bsnh, uniforms.input_output_strides) + select(0, bsnh[3], ${r});
            let j = i + select(half_rotary_emb_dim, 1, ${r});
            let re = ${_.getByOffset("i")} * ${S.get("position_id","bsnh[3]")} -
                ${_.getByOffset("j")} * ${x.get("position_id","bsnh[3]")};
            ${C.setByOffset("i","re")}
            let im = ${_.getByOffset("i")} * ${x.get("position_id","bsnh[3]")} +
                ${_.getByOffset("j")} * ${S.get("position_id","bsnh[3]")};
            ${C.setByOffset("j","im")}
          } else {
            let k = dot(bsnh, uniforms.input_output_strides) + half_rotary_emb_dim;
            ${C.setByOffset("k",_.getByOffset("k"))}
          }
        }`};return{name:"RotaryEmbedding",shaderCache:{hint:g({interleaved:r}).cacheKey,inputDependencies:["rank","rank","rank","rank"]},getShaderSource:y,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(U.size(h)/T)},programUniforms:m})}},Gl=(e,t)=>{ql(e.inputs,t),e.compute(Ua(e.inputs,t))}}),Hl,Kl,Un,Zl,Ql,Gc=I(()=>{b(),pe(),hn(),Dl(),Fl(),it(),jl(),re(),Hl=(e,t)=>{if(t.doRotary&&e.length<=7)throw new Error("cos_cache and sin_cache inputs are required if do_rotary is specified");let r=e[0],i=e[1],a=e[2],n=e[3],s=e[4];if(t.doRotary!==0&&e.length<=7)throw new Error("cos_cast and sin_cache are expected if do_rotary attribute is non-zero");if(t.localWindowSize!==-1)throw new Error("Local attention is not supported");if(t.softcap!==0)throw new Error("Softcap is not supported");if(t.rotaryInterleaved!==0)throw new Error("Rotary interleaved is not supported");if(t.smoothSoftmax)throw new Error("Smooth softmax is not supported");if(r.dims.length!==3&&r.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let o=!1,u=r.dims[0],l=r.dims[1],d=r.dims.length===3?o?r.dims[2]/3:r.dims[2]:t.numHeads*r.dims[4],p=l,h=0,f=!i||i.dims.length===0,m=Math.floor(f?d/(t.numHeads+2*t.kvNumHeads):d/t.numHeads);f&&(d=m*t.numHeads);let y=n&&n.dims.length!==0,$=s&&s.dims.length!==0;if(y&&n.dims.length===4&&n.dims[0]===u&&n.dims[1]!==t.kvNumHeads&&n.dims[2]===t.kvNumHeads&&n.dims[3]===m)throw new Error("BSNH pastKey/pastValue is not supported");if(y&&$){if(n.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(s.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');h=n.dims[2]}else if(y||$)throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let _=1;if(i&&i.dims.length>0){if(r.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(i.dims.length<3||i.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(r.dims[0]!==i.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(i.dims.length===3){if(r.dims[2]%i.dims[2]!==0)throw new Error('Dimension 2 of "query" should be a multiple of "key"');p=i.dims[1]}else if(i.dims.length===5){if(i.dims[2]!==t.numHeads||i.dims[3]!==2||i.dims[4]!==m)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(a)throw new Error('Expect "value" be none when "key" has packed kv format.');p=i.dims[1]}else{if(i.dims[1]!==t.numHeads||i.dims[3]!==m)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');p=i.dims[2]}}else{if(r.dims.length!==3&&r.dims.length!==5)throw new Error('Input "query" is expected to have 3 or 5 dimensions when key is empty');if(r.dims.length===5&&(r.dims[2]!==t.numHeads||r.dims[3]!==3))throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');_=3}let w=0,S=!1,x=t.kvNumHeads?m*t.kvNumHeads:d;if(a&&a.dims.length>0){if(a.dims.length!==3&&a.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(r.dims[0]!==a.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(a.dims.length===3){if(p!==a.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');x=a.dims[2]}else{if(p!==a.dims[2])throw new Error('Input "past_key" and "past_value" shall have the same dim 2 (kv_sequence_length)');x=a.dims[1]*a.dims[3],S=!0}}let C=e.length>4?e[5]:void 0;if(C&&C.dims.length!==1&&C.dims[0]!==u)throw new Error('Input "seqlens" is expected to have 1 dimension and the same dim 0 as batch_size');return{batchSize:u,sequenceLength:l,pastSequenceLength:h,kvSequenceLength:p,totalSequenceLength:-1,maxSequenceLength:-1,inputHiddenSize:0,hiddenSize:d,vHiddenSize:x,headSize:m,vHeadSize:Math.floor(x/t.kvNumHeads),numHeads:t.numHeads,kvNumHeads:t.kvNumHeads,nReps:t.numHeads/t.kvNumHeads,pastPresentShareBuffer:!1,maskType:w,scale:t.scale,broadcastResPosBias:!1,passPastInKv:S,qkvFormat:_}},Kl=g({perm:[0,2,1,3]}),Un=(e,t,r)=>{let i=t,a=r.kvNumHeads;return t.dims.length===3&&r.kvSequenceLength!==0&&(i=t.reshape([r.batchSize,r.kvSequenceLength,a,r.headSize]),i=e.compute(pt(i,Kl.perm),{inputs:[i],outputs:[-1]})[0]),i},Zl=(e,t,r,i)=>{let a=7,n=["type","type"],s=[e*t],o=e*t,u=[{type:12,data:o},{type:12,data:t},{type:12,data:e}],l=d=>{let p=z("seq_lens",r.dataType,r.dims),h=z("total_seq_lens",i.dataType,i.dims),f=H("pos_ids",a,s),m=[{name:"output_size",type:"u32"},{name:"sequence_length",type:"u32"},{name:"batch_size",type:"u32"}];return`
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
  `};return{name:"GeneratePositionIds",shaderCache:{hint:`${e};${t}`,inputDependencies:n},getRunData:()=>({outputs:[{dims:s,dataType:a}],dispatchGroup:{x:Math.ceil(o/64)},programUniforms:u}),getShaderSource:l}},Ql=(e,t)=>{var x;let r=Hl(e.inputs,t);if(e.inputs[0].dims.length===5)throw new Error("Packed QKV is not implemented");if(((x=e.inputs[1])==null?void 0:x.dims.length)===5)throw new Error("Packed KV is not implemented");let i=e.inputs[0],a=e.inputs[1]&&e.inputs[1].dims.length>0?e.inputs[1]:void 0,n=e.inputs[2]&&e.inputs[2].dims.length>0?e.inputs[2]:void 0,s=e.inputs[3]&&e.inputs[3].dims.length!==0?e.inputs[3]:void 0,o=e.inputs[4]&&e.inputs[4].dims.length!==0?e.inputs[4]:void 0,u=e.inputs.length>4?e.inputs[5]:void 0,l=e.inputs.length>5?e.inputs[6]:void 0,d=r.kvNumHeads?r.kvNumHeads:r.numHeads,p=g({axis:2,numOutputs:3,splitSizes:[r.numHeads*r.headSize,d*r.headSize,d*r.headSize]}),[h,f,m]=!a&&!n?e.compute(Pn([i],p),{inputs:[i],outputs:[-1,-1,-1]}):[i,a,n],y,$;if(t.doRotary){let C=e.compute(Zl(r.batchSize,r.sequenceLength,u,l),{inputs:[u,l],outputs:[-1]})[0],D=e.inputs[7],M=e.inputs[8],N=g({interleaved:t.rotaryInterleaved!==0,numHeads:r.numHeads,rotaryEmbeddingDim:0,scale:t.scale}),V=[h,C,D,M],Z=[-1];y=e.compute(Ua(V,N),{inputs:V,outputs:Z})[0],V.splice(0,1,f);let de=g({interleaved:t.rotaryInterleaved!==0,numHeads:r.kvNumHeads,rotaryEmbeddingDim:0,scale:t.scale});$=e.compute(Ua(V,de),{inputs:V,outputs:Z})[0]}let _=ha(e,r.batchSize,r.numHeads,r.sequenceLength,r.headSize,t.doRotary?y:h,void 0,0),w=Un(e,t.doRotary?$:f,r),S=Un(e,m,r);ua(e,_,w,S,void 0,void 0,s,o,void 0,r,u,l)}}),Nn,Xl,Yl,Jl,jc=I(()=>{pe(),ae(),it(),re(),Nn=(e,t,r,i,a,n,s,o)=>{let u=O(n),l=u===1?"f32":`vec${u}f`,d=u===1?"vec2f":`mat2x${u}f`,p=a*s,h=64;p===1&&(h=256);let f=[a,s,n/u],m=[a,s,2],y=["rank","type","type"],$=[];$.push(...E(f,m));let _=w=>{let S=z("x",t.dataType,3,u),x=z("scale",r.dataType,r.dims),C=z("bias",i.dataType,i.dims),D=H("output",1,3,2),M=[S,x,C,D];return`
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
      let sum_final = ${q("workgroup_shared[0][0]",u)} / f32(hight * ${u});
      let squared_sum_final = ${q("workgroup_shared[0][1]",u)} / f32(hight * ${u});

      let inv_std_dev = inverseSqrt(squared_sum_final - sum_final * sum_final + f32(${o}));
      let channel_scale = inv_std_dev * f32(scale[channel]);
      let channel_shift = f32(bias[channel]) - sum_final * channel_scale;
      output[workgroup_index] = vec2f(channel_scale, channel_shift);
    }
  }`};return e.compute({name:"InstanceNormComputeChannelScaleShift",shaderCache:{hint:`${u};${o};${h}`,inputDependencies:y},getRunData:()=>({outputs:[{dims:m,dataType:1}],dispatchGroup:{x:p},programUniforms:$}),getShaderSource:_},{inputs:[t,r,i],outputs:[-1]})[0]},Xl=(e,t,r)=>{let i=t[0].dims,a=i,n=2,s=i[0],o=i[1],u=U.sizeFromDimension(i,n),l=O(u),d=U.size(a)/l,p=Nn(e,t[0],t[1],t[2],s,u,o,r.epsilon),h=[s,o,u/l],f=[s,o],m=["type","none"],y=$=>{let _=z("x",t[0].dataType,h.length,l),w=z("scale_shift",1,f.length,2),S=H("output",t[0].dataType,h.length,l),x=[_,w,S];return`
  ${$.registerUniform("output_size","u32").declareVariables(...x)}
  ${$.mainStart()}
  ${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let outputIndices = ${S.offsetToIndices("global_idx")};
      let batch = outputIndices[0];
      let channel = outputIndices[1];
      let scale_shift = ${w.getByIndices("vec2<u32>(batch, channel)")};
      let value = ${_.getByOffset("global_idx")} * ${S.type.value}(scale_shift.x) + ${S.type.value}(scale_shift.y);
      ${S.setByOffset("global_idx","value")};
  }`};e.compute({name:"InstanceNormalization",shaderCache:{hint:`${l}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:a,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:[{type:12,data:d},...E(h,f,h)]}),getShaderSource:y},{inputs:[t[0],p]})},Yl=(e,t,r)=>{let i=t[0].dims,a=i,n=i[0],s=i[i.length-1],o=U.sizeFromDimension(i,1)/s,u=O(s),l=U.size(a)/u,d=[{type:12,data:o},{type:12,data:Math.floor(s/u)}],p=["type","type"],h=!1,f=[0,i.length-1];for(let _=0;_<i.length-2;_++)h=h||i[_+1]!==1,f.push(_+1);h=h&&i[i.length-1]!==1;let m=h?e.compute(pt(e.inputs[0],f),{inputs:[e.inputs[0]],outputs:[-1]})[0]:e.inputs[0].reshape(Array.from({length:i.length},(_,w)=>i[f[w]])),y=Nn(e,m,t[1],t[2],n,o,s,r.epsilon),$=_=>{let w=A(t[0].dataType),S=u===1?"vec2f":`mat${u}x2f`,x=M=>{let N=M===0?"x":"y",V=u===1?"f32":`vec${u}f`;switch(u){case 1:return`${w}(${V}(scale.${N}))`;case 2:return`vec2<${w}>(${V}(scale[0].${N}, scale[1].${N}))`;case 4:return`vec4<${w}>(${V}(scale[0].${N}, scale[1].${N}, scale[2].${N}, scale[3].${N}))`;default:throw new Error(`Not supported compoents ${u}`)}},C=z("input",t[0].dataType,t[0].dims,u),D=H("output",t[0].dataType,a,u);return`
  @group(0) @binding(0) var<storage, read> input : array<${C.type.storage}>;
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
  }`};e.compute({name:"InstanceNormalizationNHWC",shaderCache:{hint:`${u}`,inputDependencies:p},getRunData:()=>({outputs:[{dims:a,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:d}),getShaderSource:$},{inputs:[t[0],y]})},Jl=(e,t)=>{t.format==="NHWC"?Yl(e,e.inputs,t):Xl(e,e.inputs,t)}}),ed,td,rd,Hc=I(()=>{pe(),ae(),re(),ed=e=>{if(!e||e.length<2)throw new Error("layerNorm requires at least 2 inputs.")},td=(e,t,r)=>{let i=t.simplified,a=e[0].dims,n=e[1],s=!i&&e[2],o=a,u=U.normalizeAxis(t.axis,a.length),l=U.sizeToDimension(a,u),d=U.sizeFromDimension(a,u),p=U.size(n.dims),h=s?U.size(s.dims):0;if(p!==d||s&&h!==d)throw new Error(`Size of X.shape()[axis:] == ${d}.
       Size of scale and bias (if provided) must match this.
       Got scale size of ${p} and bias size of ${h}`);let f=[];for(let C=0;C<a.length;++C)C<u?f.push(a[C]):f.push(1);let m=O(d),y=["type","type"],$=[{type:12,data:l},{type:1,data:d},{type:12,data:Math.floor(d/m)},{type:1,data:t.epsilon}];s&&y.push("type");let _=r>1,w=r>2,S=C=>{let D=A(e[0].dataType),M=[z("x",e[0].dataType,e[0].dims,m),z("scale",n.dataType,n.dims,m)];s&&M.push(z("bias",s.dataType,s.dims,m)),M.push(H("output",e[0].dataType,o,m)),_&&M.push(H("mean_data_output",1,f)),w&&M.push(H("inv_std_output",1,f));let N=[{name:"norm_count",type:"u32"},{name:"norm_size",type:"f32"},{name:"norm_size_vectorized",type:"u32"},{name:"epsilon",type:"f32"}];return`
  ${C.registerUniforms(N).declareVariables(...M)}
  ${C.mainStart()}
    ${C.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.norm_count")}
    let offset = global_idx * uniforms.norm_size_vectorized;
    var mean_vector = ${L("f32",m)};
    var mean_square_vector = ${L("f32",m)};

    for (var h: u32 = 0u; h < uniforms.norm_size_vectorized; h++) {
      let value = ${F(D,m,"x[h + offset]")};
      mean_vector += value;
      mean_square_vector += value * value;
    }
    let mean = ${q("mean_vector",m)} / uniforms.norm_size;
    let inv_std_dev = inverseSqrt(${q("mean_square_vector",m)} / uniforms.norm_size ${i?"":"- mean * mean"} + uniforms.epsilon);

    for (var j: u32 = 0; j < uniforms.norm_size_vectorized; j++) {
      let f32input = ${F(D,m,"x[j + offset]")};
      let f32scale = ${F(D,m,"scale[j]")};
      output[j + offset] = ${M[0].type.value}((f32input ${i?"":"- mean"}) * inv_std_dev * f32scale
        ${s?`+ ${F(D,m,"bias[j]")}`:""}
      );
    }

    ${_?"mean_data_output[global_idx] = mean":""};
    ${w?"inv_std_output[global_idx] = inv_std_dev":""};
  }`},x=[{dims:o,dataType:e[0].dataType}];return _&&x.push({dims:f,dataType:1}),w&&x.push({dims:f,dataType:1}),{name:"LayerNormalization",shaderCache:{hint:`${m};${r};${i}`,inputDependencies:y},getRunData:()=>({outputs:x,dispatchGroup:{x:Math.ceil(l/64)},programUniforms:$}),getShaderSource:S}},rd=(e,t)=>{ed(e.inputs),e.compute(td(e.inputs,t,e.outputCount))}}),id,ad,Kc=I(()=>{ae(),$n(),Tn(),id=e=>{if(!e||e.length!==2)throw new Error("MatMul requires 2 inputs.");if(e[0].dims[e[0].dims.length-1]!==e[1].dims[e[1].dims.length-2])throw new Error("shared dimension does not match.")},ad=e=>{id(e.inputs);let t=Ht.calcShape(e.inputs[0].dims,e.inputs[1].dims,!0);if(!t)throw new Error("Can't use matmul on the given tensors");let r=t[t.length-1],i=e.inputs[0].dims[e.inputs[0].dims.length-1];if(r<8&&i<8)e.compute(bn(e.inputs,{activation:""},t));else{let a=t[t.length-2],n=U.size(e.inputs[0].dims.slice(0,-2)),s=U.size(e.inputs[1].dims.slice(0,-2));if(n!==1&&a===1&&s===1){let o=e.inputs[0].reshape([1,n,i]),u=e.inputs[1].reshape([1,i,r]),l=[1,n,r],d=[o,u];e.compute(Ba(d,{activation:""},t,l),{inputs:d})}else e.compute(Ba(e.inputs,{activation:""},t))}}}),nd,sd,od,ud,ld,Zc=I(()=>{pe(),ae(),b(),re(),nd=(e,t)=>{if(e.length<3||e.length>4)throw new Error("MatMulNBits requires 3 or 4 inputs");let r=e[0],i=r.dims.length;if(r.dims[i-1]!==t.k)throw new Error("The last dim of input shape does not match the k value");let a=Math.floor((t.k+t.blockSize-1)/t.blockSize),n=t.blockSize/8*t.bits,s=e[1];if(!U.areEqual(s.dims,[t.n,a,n]))throw new Error("The second inputs must be 3D tensor with shape N X nBlocksPerCol X blobSize");let o=e[2].dims;if(U.size(o)!==t.n*a)throw new Error("scales input size error.");if(e.length===4){let u=e[3].dims,l=t.n*(t.bits===8?a:Math.floor((a*t.bits+7)/8));if(U.size(u)!==l)throw new Error("zeroPoints input size error.")}},sd=(e,t)=>{let r=e[0].dims,i=r.length,a=r[i-2],n=t.k,s=t.n,o=r.slice(0,i-2),u=U.size(o),l=e[1].dims[2]/4,d=e[0].dataType,p=O(t.k),h=O(l),f=O(s),m=o.concat([a,s]),y=a>1&&s/f%2===0?2:1,$=U.size(m)/f/y,_=64,w=[],S=[u,a,n/p],x=U.convertShape(e[1].dims).slice();x.splice(-1,1,l/h),w.push(...E(S)),w.push(...E(x)),w.push(...E(e[2].dims)),e.length===4&&w.push(...E(U.convertShape(e[3].dims)));let C=[u,a,s/f];w.push(...E(C));let D=M=>{let N=S.length,V=z("a",e[0].dataType,N,p),Z=z("b",12,x.length,h),de=z("scales",e[2].dataType,e[2].dims.length),ee=[V,Z,de],ue=e.length===4?z("zero_points",12,e[3].dims.length):void 0;ue&&ee.push(ue);let ze=C.length,be=H("output",e[0].dataType,ze,f),ne=A(e[0].dataType),ve=(()=>{switch(p){case 1:return`array<${ne}, 8>`;case 2:return`mat4x2<${ne}>`;case 4:return`mat2x4<${ne}>`;default:throw new Error(`${p}-component is not supported.`)}})(),ie=()=>{let W=`
          // reuse a data
            var input_offset = ${V.indicesToOffset(`${V.type.indices}(batch, row, word_offset)`)};
            var a_data: ${ve};
            for (var j: u32 = 0; j < ${8/p}; j++) {
              a_data[j] = ${V.getByOffset("input_offset")};
              input_offset++;
            }
          `;for(let X=0;X<f*y;X++)W+=`
            b_value = ${h===1?`b${X}_data`:`b${X}_data[i]`};
            b_value_lower = unpack4xU8(b_value & b_mask);
            b_value_upper = unpack4xU8((b_value >> 4) & b_mask);
            b_quantized_values = ${ve}(${Array.from({length:4},(se,xe)=>`${ne}(b_value_lower[${xe}]), ${ne}(b_value_upper[${xe}])`).join(", ")});
            b_dequantized_values = ${p===1?`${ve}(${Array.from({length:8},(se,xe)=>`(b_quantized_values[${xe}] - ${ue?`zero_point${X}`:"zero_point"}) * scale${X}`).join(", ")});`:`(b_quantized_values - ${ve}(${Array(8).fill(`${ue?`zero_point${X}`:"zero_point"}`).join(",")})) * scale${X};`};
            workgroup_shared[local_id.x * ${y} + ${Math.floor(X/f)}]${f>1?`[${X%f}]`:""} += ${Array.from({length:8/p},(se,xe)=>`${p===1?`a_data[${xe}] * b_dequantized_values[${xe}]`:`dot(a_data[${xe}], b_dequantized_values[${xe}])`}`).join(" + ")};
          `;return W},fe=()=>{let W=`
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
            let zero_point = ${ne}(8);`}
            `;for(let X=0;X<f*y;X++)W+=`
            let scale${X} = ${de.getByOffset("col_index * nBlocksPerCol + block")};
            ${ue?`
            zero_point_byte_count = col_index * zero_point_bytes_per_col + (block >> 0x1u);
            zero_point_word_index = zero_point_byte_count >> 0x2u;
            zero_point_byte_offset = zero_point_byte_count & 0x3u;
            zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_nibble_offset << 2);
            zero_point_word = ${ue.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point${X} = ${ne}((zero_point_word) & 0xFu);`:""}
            col_index += 1;`;return W},st=()=>{let W=`col_index = col * ${f};`;for(let X=0;X<f*y;X++)W+=`
            let b${X}_data = ${Z.getByIndices(`${Z.type.indices}(col_index, block, word)`)};
            col_index += 1;`;return W+=`
            var b_value: u32;
            let b_mask: u32 = 0x0F0F0F0Fu;
            var b_value_lower: vec4<u32>;
            var b_value_upper: vec4<u32>;
            var b_quantized_values: ${ve};
            var b_dequantized_values: ${ve};`,W};return`
        var<workgroup> workgroup_shared: array<${be.type.value}, ${y*_}>;
        ${M.declareVariables(...ee,be)}
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
              ${st()}
              for (var i: u32 = 0; i < ${h}; i++) {
                ${ie()}
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
        }`};return{name:"MatMulNBits",shaderCache:{hint:`${t.blockSize};${t.bits};${p};${h};${f};${y};${_}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:m,dataType:d}],dispatchGroup:{x:$},programUniforms:w}),getShaderSource:D}},od=(e,t)=>{let r=e[0].dims,i=r.length,a=r[i-2],n=t.k,s=t.n,o=r.slice(0,i-2),u=U.size(o),l=e[1].dims[2]/4,d=e[0].dataType,p=O(t.k),h=O(l),f=o.concat([a,s]),m=128,y=s%8===0?8:s%4===0?4:1,$=m/y,_=$*h*8,w=_/p,S=_/t.blockSize,x=U.size(f)/y,C=[],D=[u,a,n/p],M=U.convertShape(e[1].dims).slice();M.splice(-1,1,l/h),C.push(...E(D)),C.push(...E(M)),C.push(...E(e[2].dims)),e.length===4&&C.push(...E(U.convertShape(e[3].dims)));let N=[u,a,s];C.push(...E(N));let V=Z=>{let de=D.length,ee=z("a",e[0].dataType,de,p),ue=z("b",12,M.length,h),ze=z("scales",e[2].dataType,e[2].dims.length),be=[ee,ue,ze],ne=e.length===4?z("zero_points",12,e[3].dims.length):void 0;ne&&be.push(ne);let ve=N.length,ie=H("output",e[0].dataType,ve),fe=A(e[0].dataType),st=()=>{switch(p){case 1:return`
          let a_data0 = vec4<${fe}>(sub_a[word_offset], sub_a[word_offset + 1], sub_a[word_offset + 2], sub_a[word_offset + 3]);
          let a_data1 = vec4<${fe}>(sub_a[word_offset + 4], sub_a[word_offset + 5], sub_a[word_offset + 6], sub_a[word_offset + 7]);`;case 2:return`
          let a_data0 = vec4<${fe}>(sub_a[word_offset], sub_a[word_offset + 1]);
          let a_data1 = vec4<${fe}>(sub_a[word_offset + 2], sub_a[word_offset + 3]);`;case 4:return`
          let a_data0 = sub_a[word_offset];
          let a_data1 = sub_a[word_offset + 1];`;default:throw new Error(`${p}-component is not supported.`)}};return`
        var<workgroup> sub_a: array<${ee.type.value}, ${w}>;
        var<workgroup> inter_results: array<array<${ie.type.value}, ${$}>, ${y}>;
        ${Z.declareVariables(...be,ie)}
        ${Z.mainStart([$,y,1])}
          let output_indices = ${ie.offsetToIndices(`workgroup_index * ${y}`)};
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
                sub_a[a_offset] = ${ee.getByIndices(`${ee.type.indices}(batch, row, a_col)`)};
              } else {
                sub_a[a_offset] = ${ee.type.value}(0);
              }
            }
            workgroupBarrier();

            // each thread process one block
            let b_row = col + local_id.y;
            let block = tile * ${S} + local_id.x;
            ${ne?`
            let zero_point_bytes_per_col = (n_blocks_per_col + 1) / 2;
            let zero_point_byte_count = b_row * zero_point_bytes_per_col + (block >> 0x1u);
            let zero_point_word_index = zero_point_byte_count >> 0x2u;
            let zero_point_byte_offset = zero_point_byte_count & 0x3u;
            let zero_point_nibble_offset: u32 = block & 0x1u;
            let zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_nibble_offset << 2);
            let zero_point_word = ${ne.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point = ${fe}((zero_point_word) & 0xFu);`:`
            // The default zero point is 8 for unsigned 4-bit quantization.
            let zero_point = ${fe}(8);`}
            let scale = ${ze.getByOffset("b_row * n_blocks_per_col + block")};
            let b_data = ${ue.getByIndices(`${ue.type.indices}(b_row, block, 0)`)};
            var word_offset = local_id.x * ${t.blockSize/p};
            for (var i: u32 = 0; i < ${h}; i++) {
              ${st()}
              let b_value = ${h===1?"b_data":"b_data[i]"};
              let b_value_lower = unpack4xU8(b_value & 0x0F0F0F0Fu);
              let b_value_upper = unpack4xU8((b_value >> 4) & 0x0F0F0F0Fu);
              let b_quantized_values = mat2x4<${fe}>(${Array.from({length:4},(W,X)=>`${fe}(b_value_lower[${X}]), ${fe}(b_value_upper[${X}])`).join(", ")});
              let b_dequantized_values = (b_quantized_values - mat2x4<${fe}>(${Array(8).fill("zero_point").join(",")})) * scale;
              inter_results[local_id.y][local_id.x] += ${Array.from({length:2},(W,X)=>`${`dot(a_data${X}, b_dequantized_values[${X}])`}`).join(" + ")};
              word_offset += ${8/p};
            }
            workgroupBarrier();
          }

          if (local_idx < ${y}) {
            var output_value: ${ie.type.value} = ${ie.type.value}(0);
            for (var b = 0u; b < ${$}; b++) {
              output_value += inter_results[local_idx][b];
            }
            if (col + local_idx < uniforms.output_shape[2])
            {
              ${ie.setByIndices(`${ie.type.indices}(batch, row, col + local_idx)`,"output_value")}
            }
          }
        }`};return{name:"BlockwiseMatMulNBits32",shaderCache:{hint:`${t.blockSize};${p};${h};${$};${y}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:f,dataType:d}],dispatchGroup:{x},programUniforms:C}),getShaderSource:V}},ud=(e,t)=>{nd(e.inputs,t),t.blockSize===32&&e.adapterInfo.isVendor("intel")&&e.adapterInfo.isArchitecture("gen-12lp")?e.compute(od(e.inputs,t)):e.compute(sd(e.inputs,t))},ld=e=>g(e)}),dd,pd,cd,hd,fd,md,gd,yd,wd,Qc=I(()=>{pe(),ae(),re(),dd=e=>{if(!e||e.length<1)throw new Error("Too few inputs");if(e[0].dataType!==1&&e[0].dataType!==10)throw new Error("Input type must be float or float16.");if(e.length>=2){let t=e[0].dims.length*2===e[1].dims[0];if(e.length===4&&(t=e[3].dims[0]*2===e[1].dims[0]),!t)throw new Error("The pads should be a 1D tensor of shape [2 * input_rank] or [2 * num_axes].")}},pd=(e,t,r)=>{let i="";for(let a=t-1;a>=0;--a)i+=`
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
      `},cd=(e,t,r)=>{let i="";for(let a=t-1;a>=0;--a)i+=`
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
          `},hd=(e,t,r)=>{let i="";for(let a=t-1;a>=0;--a)i+=`
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
          `},fd=(e,t,r)=>{let i="";for(let a=t-1;a>=0;--a)i+=`
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
          `},md=(e,t,r)=>{switch(r.mode){case 0:return pd(e,t,r.pads.length);case 1:return cd(e,t,r.pads.length);case 2:return hd(e,t,r.pads.length);case 3:return fd(e,t,r.pads.length);default:throw new Error("Invalid mode")}},gd=(e,t)=>{let r=U.padShape(e[0].dims.slice(),t.pads),i=e[0].dims,a=U.size(r),n=[{type:12,data:a},{type:6,data:t.pads}],s=e.length>=3&&e[2].data;t.mode===0&&n.push({type:s?e[2].dataType:1,data:t.value}),n.push(...E(e[0].dims,r));let o=["rank"],u=l=>{let d=H("output",e[0].dataType,r.length),p=z("x",e[0].dataType,i.length),h=p.type.value,f=md(d,i.length,t),m=[{name:"output_size",type:"u32"},{name:"pads",type:"i32",length:t.pads.length}];return t.mode===0&&m.push({name:"constant_value",type:s?h:"f32"}),`
            ${l.registerUniforms(m).declareVariables(p,d)}
            ${l.mainStart()}
            ${l.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

            let indices = ${d.offsetToIndices("global_idx")};

            var value = ${h}(0);
            ${f}
            output[global_idx] = value;
        }`};return{name:"Pad",shaderCache:{hint:`${t.mode}${s}`,inputDependencies:o},getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(U.size(r)/64)},programUniforms:n}),getShaderSource:u}},yd=(e,t)=>{if(e.length>1){let r=e[1].getBigInt64Array(),i=e.length>=3&&e[2].data?e[2].dataType===10?e[2].getUint16Array()[0]:e[2].getFloat32Array()[0]:0,a=e[0].dims.length,n=new Int32Array(2*a).fill(0);if(e.length>=4){let o=e[3].getBigInt64Array();for(let u=0;u<o.length;u++)n[Number(o[u])]=Number(r[u]),n[Number(o[u])+a]=Number(r[u+o.length])}else r.forEach((o,u)=>n[Number(u)]=Number(o));let s=[];return n.forEach(o=>s.push(o)),{mode:t.mode,value:i,pads:s}}else return t},wd=(e,t)=>{dd(e.inputs);let r=yd(e.inputs,t);e.compute(gd(e.inputs,r),{inputs:[0]})}}),fa,Ln,Vn,Wn,Fn,_d,bd,qn,Gn,$d,vd,jn,xd,Sd,Hn,Td,Ed,kd,Id,Xc=I(()=>{Qe(),pe(),ae(),re(),fa=e=>{if(te.webgpu.validateInputContent&&(!e||e.length!==1))throw new Error("Pool ops requires 1 input.")},Ln=(e,t,r)=>{let i=t.format==="NHWC",a=e.dims.slice();i&&a.splice(1,0,a.pop());let n=Object.hasOwnProperty.call(t,"dilations"),s=t.kernelShape.slice(),o=t.strides.slice(),u=n?t.dilations.slice():[],l=t.pads.slice();sr.adjustPoolAttributes(r,a,s,o,u,l);let d=sr.computePoolOutputShape(r,a,o,u,s,l,t.autoPad),p=Object.assign({},t);n?Object.assign(p,{kernelShape:s,strides:o,pads:l,dilations:u,cacheKey:t.cacheKey}):Object.assign(p,{kernelShape:s,strides:o,pads:l,cacheKey:t.cacheKey});let h=d.slice();return h.push(h.splice(1,1)[0]),[p,i?h:d]},Vn=(e,t)=>{let r=t.format==="NHWC",i=U.size(e),a=U.size(t.kernelShape),n=[{type:12,data:i},{type:12,data:a}],s=[{name:"outputSize",type:"u32"},{name:"kernelSize",type:"u32"}];if(t.kernelShape.length<=2){let o=t.kernelShape[t.kernelShape.length-1],u=t.strides[t.strides.length-1],l=t.pads[t.pads.length/2-1],d=t.pads[t.pads.length-1],p=!!(l+d);n.push({type:12,data:o},{type:12,data:u},{type:12,data:l},{type:12,data:d}),s.push({name:"kw",type:"u32"},{name:"sw",type:"u32"},{name:"pwStart",type:"u32"},{name:"pwEnd",type:"u32"});let h=!1;if(t.kernelShape.length===2){let f=t.kernelShape[t.kernelShape.length-2],m=t.strides[t.strides.length-2],y=t.pads[t.pads.length/2-2],$=t.pads[t.pads.length-2];h=!!(y+$),n.push({type:12,data:f},{type:12,data:m},{type:12,data:y},{type:12,data:$}),s.push({name:"kh",type:"u32"},{name:"sh",type:"u32"},{name:"phStart",type:"u32"},{name:"phEnd",type:"u32"})}return[n,s,!0,p,h]}else{if(r)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let o=U.computeStrides(t.kernelShape);n.push({type:12,data:o},{type:12,data:t.pads},{type:12,data:t.strides}),s.push({name:"kernelStrides",type:"u32",length:o.length},{name:"pads",type:"u32",length:t.pads.length},{name:"strides",type:"u32",length:t.strides.length});let u=t.pads.reduce((l,d)=>l+d);return[n,s,!!u,!1,!1]}},Wn=(e,t,r,i,a,n,s,o,u,l,d,p)=>{let h=a.format==="NHWC",f=t.type.value,m=H("output",t.type.tensor,i);if(a.kernelShape.length<=2){let y="",$="",_="",w=r-(h?2:1);if(d?y=`
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
                }`,a.kernelShape.length===2){let S=r-(h?3:2);p?$=`
                for (var j: u32 = 0u; j < uniforms.kh; j++) {
                  xIndices[${S}] = indices[${S}] * uniforms.sh - uniforms.phStart + j;
                  if (xIndices[${S}] < 0 || xIndices[${S}] >= uniforms.x_shape[${S}]) {
                    pad += i32(uniforms.kw);
                    continue;
                  }
              `:$=`
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
              ${$}
              ${y}
              ${_}
              ${s}

              output[global_idx] = value;
            }`}else{if(h)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let y=a.kernelShape.length,$=a.pads.length,_="";return l?_=`
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
                    + offsets[j - ${r-y}u] - ${P("uniforms.pads","j - 2u",$)};
                  ${_}
              }
              ${s}

              output[global_idx] = value;
            }`}},Fn=e=>`${e.format};${e.ceilMode};${e.autoPad};${e.kernelShape.length}`,_d=e=>`${Fn(e)};${e.countIncludePad}`,bd=e=>`${Fn(e)};${e.storageOrder};${e.dilations}`,qn=e=>({format:e.format,autoPad:["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],ceilMode:e.ceil_mode,kernelShape:e.kernel_shape,strides:e.strides,pads:e.pads}),Gn=(e,t,r,i)=>{let[a,n]=Ln(t,i,r),s=z("x",t.dataType,t.dims.length),o=s.type.value,u="value += x_val;",l="";a.countIncludePad?l+=`value /= ${o}(uniforms.kernelSize);`:l+=`value /= ${o}(i32(uniforms.kernelSize) - pad);`;let[d,p,h,f,m]=Vn(n,a);d.push(...E(t.dims,n));let y=["rank"];return{name:e,shaderCache:{hint:`${i.cacheKey};${h};${f};${m}`,inputDependencies:y},getRunData:()=>({outputs:[{dims:n,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(U.size(n)/64)},programUniforms:d}),getShaderSource:$=>Wn($,s,t.dims.length,n.length,a,u,l,0,p,h,f,m)}},$d=e=>{let t=e.count_include_pad!==0,r=qn(e);if(r.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for AveragePool");let i={countIncludePad:t,...r,cacheKey:""};return{...i,cacheKey:_d(i)}},vd=(e,t)=>{fa(e.inputs),e.compute(Gn("AveragePool",e.inputs[0],!1,t))},jn={autoPad:"",ceilMode:0,countIncludePad:!1,kernelShape:[],strides:[],pads:[],storageOrder:0,dilations:[]},xd=e=>{let t=e.format;return{format:t,...jn,cacheKey:t}},Sd=(e,t)=>{fa(e.inputs),e.compute(Gn("GlobalAveragePool",e.inputs[0],!0,t))},Hn=(e,t,r,i)=>{let[a,n]=Ln(t,i,r),s=`
      value = max(x_val, value);
    `,o="",u=z("x",t.dataType,t.dims.length),l=["rank"],[d,p,h,f,m]=Vn(n,a);return d.push(...E(t.dims,n)),{name:e,shaderCache:{hint:`${i.cacheKey};${h};${f};${m}`,inputDependencies:l},getRunData:()=>({outputs:[{dims:n,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(U.size(n)/64)},programUniforms:d}),getShaderSource:y=>Wn(y,u,t.dims.length,n.length,a,s,o,t.dataType===10?-65504:-1e5,p,h,f,m)}},Td=(e,t)=>{fa(e.inputs),e.compute(Hn("MaxPool",e.inputs[0],!1,t))},Ed=e=>{let t=e.storage_order,r=e.dilations,i=qn(e);if(t!==0)throw new Error("column major storage order is not yet supported for MaxPool");if(i.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for MaxPool");let a={storageOrder:t,dilations:r,...i,cacheKey:""};return{...a,cacheKey:bd(a)}},kd=e=>{let t=e.format;return{format:t,...jn,cacheKey:t}},Id=(e,t)=>{fa(e.inputs),e.compute(Hn("GlobalMaxPool",e.inputs[0],!0,t))}}),Cd,zd,Ad,Od,Yc=I(()=>{pe(),ae(),b(),re(),Cd=(e,t)=>{if(e.length<2||e.length>3)throw new Error("DequantizeLinear requires 2 or 3 inputs.");if(e.length===3&&e[1].dims===e[2].dims)throw new Error("x-scale and x-zero-point must have the same shape.");if(e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[0].dataType===6&&e.length>2)throw new Error("In the case of dequantizing int32 there is no zero point.");if(e[1].dims.length!==0&&e[1].dims.length!==1&&e[1].dims.length!==e[0].dims.length)throw new Error("scale input must be a scalar, a 1D tensor, or have the same rank as the input tensor.");if(e.length>2){if(e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[1].dims.length!==e[2].dims.length)throw new Error("scale and zero-point inputs must have the same rank.");if(!e[1].dims.map((r,i)=>r===e[2].dims[i]).reduce((r,i)=>r&&i,!0))throw new Error("scale and zero-point inputs must have the same shape.")}if(t.blockSize>0){if(e[1].dims.length===0||e[1].dims.length===1&&e[1].dims[0]===1)throw new Error("blockSize must be set only for block quantization.");if(!e[1].dims.map((a,n)=>n===t.axis||a===e[0].dims[n]).reduce((a,n)=>a&&n,!0))throw new Error("For block qunatization, scale input shape to match the input shape except for the axis");if(e[1].dims.length!==e[0].dims.length)throw new Error("For block qunatization the scale input rank must be the same as the x rank.");let r=e[0].dims[t.axis],i=e[1].dims[t.axis];if(t.blockSize<Math.ceil(r/i)||t.blockSize>Math.ceil(r/(i-1)-1))throw new Error("blockSize must be with in the range [ceil(dI / Si), ceil(dI / (Si - 1) - 1)].")}},zd=(e,t)=>{let r=U.normalizeAxis(t.axis,e[0].dims.length),i=e[0].dataType,a=i===3,n=e[0].dims,s=e[1].dataType,o=U.size(n),u=i===3||i===2,l=u?[Math.ceil(U.size(e[0].dims)/4)]:e[0].dims,d=e[1].dims,p=e.length>2?e[2]:void 0,h=p?u?[Math.ceil(U.size(p.dims)/4)]:p.dims:void 0,f=d.length===0||d.length===1&&d[0]===1,m=f===!1&&d.length===1,y=O(o),$=f&&(!u||y===4),_=$?y:1,w=$&&!u?y:1,S=z("input",u?12:i,l.length,w),x=z("scale",s,d.length),C=p?z("zero_point",u?12:i,h.length):void 0,D=H("output",s,n.length,_),M=[S,x];C&&M.push(C);let N=[l,d];p&&N.push(h);let V=[{type:12,data:o/_},{type:12,data:r},{type:12,data:t.blockSize},...E(...N,n)],Z=de=>{let ee=[{name:"output_size",type:"u32"},{name:"axis",type:"u32"},{name:"block_size",type:"u32"}];return`
      ${de.registerUniforms(ee).declareVariables(...M,D)}
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
          ${C?f?u?`
                let zero_point_input = ${C.getByOffset("0")};
                let zero_point_vec =  ${a?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value= zero_point_vec[0]`:`let zero_point_value = ${C.getByOffset("0")}`:m?u?`
                let zero_point_index = ${D.indicesGet("output_indices","uniforms.axis")};
                let zero_point_input = ${C.getByOffset("zero_point_index / 4")};
                let zero_point_vec =  ${a?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_index % 4]`:`
                let zero_point_index = ${D.indicesGet("output_indices","uniforms.axis")};
                let zero_point_value = ${C.getByOffset("zero_point_index")};`:u?`
                let zero_point_offset = ${x.indicesToOffset("scale_indices")};
                let zero_point_input = ${C.getByOffset("zero_point_offset / 4")};
                let zero_point_vec = ${a?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_offset % 4];`:`let zero_point_value = ${C.getByIndices("scale_indices")};`:`let zero_point_value = ${u?a?"i32":"u32":S.type.value}(0);`};
      // Compute and write output
      ${D.setByOffset("global_idx",`${D.type.value}(x_value - zero_point_value) * scale_value`)};
      }`};return{name:"DequantizeLinear",shaderCache:{hint:t.cacheKey,inputDependencies:C?["rank","rank","rank"]:["rank","rank"]},getShaderSource:Z,getRunData:()=>({outputs:[{dims:n,dataType:s}],dispatchGroup:{x:Math.ceil(o/_/64),y:1,z:1},programUniforms:V})}},Ad=(e,t)=>{Cd(e.inputs,t),e.compute(zd(e.inputs,t))},Od=e=>g({axis:e.axis,blockSize:e.blockSize})}),Rd,Bd,Md,Jc=I(()=>{Qe(),pe(),re(),Rd=(e,t,r)=>{let i=e===t,a=e<t&&r<0,n=e>t&&r>0;if(i||a||n)throw new Error("Range these inputs' contents are invalid.")},Bd=(e,t,r,i)=>{let a=Math.abs(Math.ceil((t-e)/r)),n=[a],s=a,o=[{type:12,data:s},{type:i,data:e},{type:i,data:r},...E(n)],u=l=>{let d=H("output",i,n.length),p=d.type.value,h=[{name:"outputSize",type:"u32"},{name:"start",type:p},{name:"delta",type:p}];return`
        ${l.registerUniforms(h).declareVariables(d)}
        ${l.mainStart()}
        ${l.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        output[global_idx] = uniforms.start + ${p}(global_idx) * uniforms.delta;
      }`};return{name:"Range",shaderCache:{hint:`${i}`},getShaderSource:u,getRunData:()=>({outputs:[{dims:n,dataType:i}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:o})}},Md=e=>{let t=0,r=0,i=0;e.inputs[0].dataType===6?(t=e.inputs[0].getInt32Array()[0],r=e.inputs[1].getInt32Array()[0],i=e.inputs[2].getInt32Array()[0]):e.inputs[0].dataType===1&&(t=e.inputs[0].getFloat32Array()[0],r=e.inputs[1].getFloat32Array()[0],i=e.inputs[2].getFloat32Array()[0]),te.webgpu.validateInputContent&&Rd(t,r,i),e.compute(Bd(t,r,i,e.inputs[0].dataType),{inputs:[]})}}),Dd,Pd,Ud,Nd,eh=I(()=>{pe(),ae(),b(),re(),Dd=(e,t,r,i)=>{if(e!=="none"&&i!=="i32"&&i!=="u32"&&i!=="f32")throw new Error(`Input ${i} is not supported with reduction ${e}.`);let a=`{
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
                ${a}max(bitcast<f32>(oldValue), (${r}))${n}`;case"min":return i==="i32"||i==="u32"?`atomicMin(&${t}, bitcast<${i}>(${r}));`:`${a}min(bitcast<${i}>(oldValue), (${r}))${n}`;case"mul":return`${a}(bitcast<${i}>(oldValue) * (${r}))${n}`;default:throw new Error(`Reduction ${e} is not supported.`)}},Pd=(e,t)=>{let r=e[0].dims,i=e[1].dims,a=r,n=1,s=Math.ceil(U.sizeToDimension(i,i.length-1)/n),o=i[i.length-1],u=U.sizeFromDimension(r,o),l=[{type:12,data:s},{type:12,data:o},{type:12,data:u},...E(e[1].dims,e[2].dims,a)],d=p=>{let h=z("indices",e[1].dataType,e[1].dims.length),f=z("updates",e[2].dataType,e[2].dims.length,n),m=t.reduction!=="none"&&t.reduction!==""?Ue("output",e[0].dataType,a.length):H("output",e[0].dataType,a.length,n);return`
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
    ${Dd(t.reduction,"output[data_offset + i]","value",m.type.value)}
  }

      }`};return{name:"ScatterND",shaderCache:{hint:`${t.cacheKey}_${t.reduction}`,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:a,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:l}),getShaderSource:d}},Ud=e=>g({reduction:e.reduction}),Nd=(e,t)=>{e.compute(Pd(e.inputs,t),{inputs:[e.inputs[1],e.inputs[2]],outputs:[]})}}),Ld,Vd,Wd,Kn,Fd,qd,Gd,jd,Hd,Kd,Zd,Qd,Zn,Xd,Yd,Jd,ep,tp,rp,ip,th=I(()=>{pe(),ae(),b(),re(),Ld=(e,t)=>{if(e.every(r=>r>0||(()=>{throw new Error("Resize requires scales input values to be positive")})),e.length>0){if(t.mode==="linear"){if(!(e.length===2||e.length===3||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1||e.length===5&&e[0]===1&&e[1]===1))throw new Error(`For linear mode, Resize requires scales to be 2D, 3D, 4D with either two outermost or one innermost and
            one outermost scale values equal to 1, or 5D with two outermost scale values equal to 1`)}else if(t.mode==="cubic"&&!(e.length===2||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1))throw new Error("Resize requires scales input size to be 2 or 4 for cubic mode")}},Vd=(e,t,r)=>{t.every(a=>a>=0&&a<r||(()=>{throw new Error("Resize requires axes input values to be positive and less than rank")}));let i=new Array(r).fill(1);return t.forEach((a,n)=>i[a]=e[n]),i},Wd=(e,t,r,i,a,n)=>{let[s,o,u]=r>10?[1,2,3]:[-1,e.length>1?1:-1,-1],l=e[0].dims.length;if(s>0&&e.length>s&&e[s].dims.length>0)e[s].getFloat32Array().forEach(d=>n.push(d));else if(t.coordinateTransformMode==="tf_crop_and_resize")throw new Error("Resize requires RoI input to be specified when coordinateTransformMode is tfCropAndResize");if(o>0&&e.length>o&&e[o].dims.length===1&&e[o].dims[0]>0){if(e[o].getFloat32Array().forEach(d=>i.push(d)),i.length!==0&&i.length!==l&&r>=18&&i.length!==t.axes.length)throw new Error("Resize requires scales input size to be same as input rank or axes size for opset 18 and up");Ld(i,t),t.axes.length>0&&Vd(i,t.axes,l).forEach((d,p)=>i[p]=d)}if(u>0&&e.length>u&&e[u].dims.length===1&&e[u].dims[0]>0&&(e[u].getBigInt64Array().forEach(d=>a.push(Number(d))),a.length!==0&&a.length!==l&&r>=18&&a.length!==t.axes.length))throw new Error("Resize requires sizes input size to be same as input rank or axes size for opset 18 and up");if(t.axes.length>0){if(i.length!==0&&i.length!==t.axes.length)throw new Error('Resize requires "scales" input size to be of axes rank when axes attributes is specified');if(a.length!==0&&a.length!==t.axes.length)throw new Error('Resize requires "sizes" input size to be of rank axes rank when axes attributes is specified')}if(typeof i<"u"&&typeof a<"u"&&i.length>0&&a.length>l)throw new Error("Resize requires only of scales or sizes to be specified")},Kn=(e,t,r,i)=>`
  // The whole part and the fractional part are calculated separately due to inaccuracy of floating
  // point division. As an example, f32(21) / f32(7) may evaluate to 2.99... instead of 3, causing an
  // offset-by-one error later in floor().
  let big = (${e}) * (${t});
  let whole = ${i}(big / (${r}));
  let fract = ${i}(big % (${r})) / ${i}(${r});
  return whole + fract;
`,Fd=(e,t)=>`fn getOriginalCoordinateFromResizedCoordinate(xResized: u32, xScale: f32, lengthResized: u32,
     lengthOriginal: u32, roiStart: f32, roiEnd: f32) -> ${t} { `+(()=>{switch(e){case"asymmetric":return`
          if (xScale < 1.0 || floor(xScale) != xScale) {
            return ${t}(xResized) / ${t}(xScale);
          } else {
            ${Kn("xResized","lengthOriginal","lengthResized",t)}
          }
        `;case"pytorch_half_pixel":return`if (lengthResized > 1) {
                    return (${t}(xResized) + 0.5) / ${t}(xScale) - 0.5;
                  } else {
                    return 0.0;
                  }`;case"tf_half_pixel_for_nn":return`return (${t}(xResized) + 0.5) / ${t}(xScale);`;case"align_corners":return`if (lengthResized == 1) {
                    return 0.0;
                  } else {
                    ${Kn("xResized","lengthOriginal - 1","lengthResized - 1",t)}
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
                  return offset + ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;case"half_pixel":return`return ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;default:throw new Error(`Coordinate transform mode ${e} is not supported`)}})()+"}",qd=(e,t,r)=>`fn getNearestPixelFromOriginal(xOriginal: ${r}, isDownSample: bool) -> ${r} {`+(()=>{switch(e){case"round_prefer_ceil":return"if (fract(xOriginal) == 0.5) {             return ceil(xOriginal);           } else {             return round(xOriginal);           }";case"floor":return"return floor(xOriginal);";case"ceil":return"return ceil(xOriginal);";case"round_prefer_floor":return"if (fract(xOriginal) == 0.5) {                     return floor(xOriginal);                   } else {                     return round(xOriginal);                   }";case"simple":default:if(t<11)return"if (isDownSample)                     {                       return ceil(xOriginal);                     } else {                       return xOriginal;                     }";throw new Error(`Nearest mode ${e} is not supported`)}})()+"}",Gd=(e,t,r)=>{let i=new Array(r).fill(0).concat(new Array(r).fill(1)),a=e.length===0?i:e.slice();return t.length>0?(t.forEach((n,s)=>{i[n]=a[s],i[s+r]=a[t.length+s]}),i):a},jd=(e,t,r,i)=>{let a=[];if(r.length>0)if(i.length>0){if(e.forEach(n=>a.push(n)),Math.max(...i)>e.length)throw new Error("axes is out of bound");i.forEach((n,s)=>a[n]=r[s])}else r.forEach(n=>a.push(n));else{if(t.length===0)throw new Error("Resize requires either scales or sizes.");a=e.map((n,s)=>Math.round(n*t[s]))}return a},Hd=(e,t,r)=>{let i=(()=>{switch(r.keepAspectRatioPolicy){case"not_larger":return r.axes.length>0?Math.min(...r.axes.map(n=>t[n]),Number.MAX_VALUE):Math.min(...t,Number.MAX_VALUE);case"not_smaller":return r.axes.length>0?Math.max(...r.axes.map(n=>t[n]),Number.MIN_VALUE):Math.max(...t,Number.MIN_VALUE);default:throw new Error(`Keep aspect ratio policy ${r.keepAspectRatioPolicy} is not supported`)}})();t.fill(1,0,t.length);let a=e.slice();return r.axes.length>0?(r.axes.forEach(n=>t[n]=i),r.axes.forEach(n=>a[n]=Math.round(e[n]*t[n]))):(t.fill(i,0,t.length),a.forEach((n,s)=>a[s]=Math.round(n*t[s]))),a},Kd=(e,t,r,i,a)=>`
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
    }`,Zd=(e,t,r,i,a,n,s)=>`
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
    }`,Qd=(e,t)=>`
    fn checkInputIndices(input_indices: ${e.type.indices}) -> bool {
      for (var i:u32 = 0; i < ${t.length}; i++) {
        var input_index = ${e.indicesGet("input_indices","i")};
        if (input_index < 0 || input_index >= ${P("uniforms.input_shape","i",t.length)}) {
          return false;
        }
      }
      return true;
    }`,Zn=(e,t,r,i)=>e.rank>i?`
    ${e.indicesSet("input_indices",t,"channel")};
    ${e.indicesSet("input_indices",r,"batch")};
`:"",Xd=(e,t,r,i,a)=>{let[n,s,o,u]=r.length===2?[-1,0,1,-1]:[0,2,3,1],l=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, row: u32, col: u32) -> ${l} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",s,`max(0, min(row, ${r[s]} - 1))`)};
      ${e.indicesSet("input_indices",o,`max(0, min(col, ${r[o]} - 1))`)};
      ${Zn(e,u,n,2)}
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
    }`},Yd=(e,t,r,i,a,n,s,o,u,l)=>{let d=r.length===2,[p,h]=d?[0,1]:[2,3],f=e.type.value,m=y=>{let $=y===p?"row":"col";return`
      fn ${$}CubicInterpolation(input_indices: ${e.type.indices}, output_indices: ${t.type.indices}) -> ${f} {
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
          var ${$}: ${f} = originalIdx + ${f}(i);
          if (${$} < 0 || ${$} >= ${r[y]}) {
            ${l?`coefs[i + 1] = 0.0;
                        continue;`:o?`return ${u};`:`${$} = max(0, min(${$}, ${r[y]} - 1));`};
          }
        var input_indices_copy: ${e.type.indices} = input_indices;
          ${e.indicesSet("input_indices_copy",y,`u32(${$})`)};
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
    `},Jd=(e,t,r,i,a)=>{let[n,s,o,u,l]=r.length===3?[-1,0,1,2,-1]:[0,2,3,4,1],d=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, depth:u32, height: u32, width: u32) -> ${d} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",s,`max(0, min(depth, ${r[s]} - 1))`)};
      ${e.indicesSet("input_indices",o,`max(0, min(height, ${r[o]} - 1))`)};
      ${e.indicesSet("input_indices",u,`max(0, min(width, ${r[u]} - 1))`)};
      ${Zn(e,l,n,3)}
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
    }`},ep=(e,t,r,i,a,n)=>{let s=e.dims,o=Gd(n,t.axes,s.length),u=jd(s,i,a,t.axes),l=i.slice();i.length===0&&(l=s.map((w,S)=>w===0?1:u[S]/w),t.keepAspectRatioPolicy!=="stretch"&&(u=Hd(s,l,t)));let d=H("output",e.dataType,u.length),p=z("input",e.dataType,s.length),h=U.size(u),f=s.length===u.length&&s.every((w,S)=>w===u[S]),m=t.coordinateTransformMode==="tf_crop_and_resize",y=t.extrapolationValue,$=p.type.value,_=w=>`
      ${f?"":`
      ${Fd(t.coordinateTransformMode,$)};
      ${(()=>{switch(t.mode){case"nearest":return`
              ${Qd(p,s)};
              ${qd(t.nearestMode,r,$)};
              ${Zd(p,d,s,u,l.length,o.length,m)};
              `;case"linear":return`
              ${Kd(d,s,u,l.length,o.length)};
              ${(()=>{if(s.length===2||s.length===4)return`${Xd(p,d,s,m,y)}`;if(s.length===3||s.length===5)return`${Jd(p,d,s,m,y)}`;throw Error("Linear mode only supports input dims 2, 3, 4 and 5 are supported in linear mode.")})()};
            `;case"cubic":return`
            ${(()=>{if(s.length===2||s.length===4)return`${Yd(p,d,s,u,l,o,t.cubicCoeffA,m,t.extrapolationValue,t.excludeOutside)}`;throw Error("Cubic mode only supports input dims 2 and 4 are supported in linear mode.")})()};
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
      }`;return{name:"Resize",shaderCache:{hint:`${t.cacheKey}|${r}|${l.length>0?t.mode==="cubic"?l:l.length:""}|${a.length>0?a:""}|${o.length>0?o:""}|${f}|${t.mode==="nearest"?s.length:s}`,inputDependencies:["rank"]},getShaderSource:_,getRunData:()=>({outputs:[{dims:u,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(h/64)},programUniforms:[{type:12,data:h},{type:1,data:l},{type:1,data:o},...E(s,u)]})}},tp=e=>{let t=e.customDataBuffer;return new Uint32Array(t,t.byteOffset,1)[0]},rp=(e,t)=>{let r=[],i=[],a=[],n=tp(e);if(t.antialias!==0)throw Error("Only default value (0) for Antialias attribute is supported");Wd(e.inputs,t,n,r,i,a),e.compute(ep(e.inputs[0],t,n,r,i,a),{inputs:[0]})},ip=e=>{let t=e.antialias,r=e.axes,i=e.coordinateTransformMode,a=e.cubicCoeffA,n=e.excludeOutside!==0,s=e.extrapolationValue,o=e.keepAspectRatioPolicy,u=e.mode,l=e.nearestMode===""?"simple":e.nearestMode;return g({antialias:t,axes:r,coordinateTransformMode:i,cubicCoeffA:a,excludeOutside:n,extrapolationValue:s,keepAspectRatioPolicy:o,mode:u,nearestMode:l})}}),ap,np,sp,rh=I(()=>{pe(),ae(),re(),ap=e=>{if(!e||e.length<3)throw new Error("layerNorm requires at least 3 inputs.");let t=e[0],r=e[1],i=e[2];if(t.dataType!==r.dataType||t.dataType!==i.dataType)throw new Error("All inputs must have the same data type");if(t.dims.length!==3&&t.dims.length!==2)throw new Error("Input must be 2D or 3D");if(r.dims.length!==3&&r.dims.length!==2)throw new Error("Skip must be 2D or 3D");let a=t.dims[t.dims.length-1],n=t.dims[t.dims.length-2];if(r.dims[r.dims.length-1]!==a)throw new Error("Skip must have the same hidden size as input");if(r.dims[r.dims.length-2]!==n)throw new Error("Skip must have the same sequence length as input");if(i.dims.length!==1)throw new Error("Gamma must be 1D");if(i.dims[i.dims.length-1]!==a)throw new Error("Gamma must have the same hidden size as input");if(e.length>3){let s=e[3];if(s.dims.length!==1)throw new Error("Beta must be 1D");if(s.dims[s.dims.length-1]!==a)throw new Error("Beta must have the same hidden size as input")}if(e.length>4){let s=e[4];if(s.dims.length!==1)throw new Error("Bias must be 1D");if(s.dims[s.dims.length-1]!==a)throw new Error("Bias must have the same hidden size as input")}},np=(e,t,r,i)=>{let a=t.simplified,n=e[0].dims,s=U.size(n),o=n,u=s,l=n.slice(-1)[0],d=i?n.slice(0,-1).concat(1):[],p=!a&&e.length>3,h=e.length>4,f=i&&r>1,m=i&&r>2,y=r>3,$=64,_=O(l),w=[{type:12,data:u},{type:12,data:_},{type:12,data:l},{type:1,data:t.epsilon}],S=C=>{let D=[{name:"output_size",type:"u32"},{name:"components",type:"u32"},{name:"hidden_size",type:"u32"},{name:"epsilon",type:"f32"}],M=[z("x",e[0].dataType,e[0].dims,_),z("skip",e[1].dataType,e[1].dims,_),z("gamma",e[2].dataType,e[2].dims,_)];p&&M.push(z("beta",e[3].dataType,e[3].dims,_)),h&&M.push(z("bias",e[4].dataType,e[4].dims,_)),M.push(H("output",e[0].dataType,o,_)),f&&M.push(H("mean_output",1,d)),m&&M.push(H("inv_std_output",1,d)),y&&M.push(H("input_skip_bias_sum",e[0].dataType,o,_));let N=A(e[0].dataType),V=A(1,_);return`

      ${C.registerUniforms(D).declareVariables(...M)}
      var<workgroup> sum_shared : array<${V}, ${$}>;
      var<workgroup> sum_squared_shared : array<${V}, ${$}>;

      ${C.mainStart([$,1,1])}
        let ix = local_id.x;
        let iy = global_id.x / ${$};

        let hidden_size_vectorized: u32 = uniforms.hidden_size / uniforms.components;
        var stride = hidden_size_vectorized / ${$};
        let offset = ix * stride + iy * hidden_size_vectorized;
        let offset1d = stride * ix;
        if (ix == ${$-1}) {
          stride = hidden_size_vectorized - stride * ix;
        }
        for (var i: u32 = 0; i < stride; i++) {
          let skip_value = skip[offset + i];
          let bias_value = ${h?"bias[offset1d + i]":N+"(0.0)"};
          let input_value = x[offset + i];
          let value = input_value + skip_value + bias_value;
          ${y?"input_skip_bias_sum[offset + i] = value;":""}
          output[offset + i] = value;
          let f32_value = ${F(N,_,"value")};
          sum_shared[ix] += f32_value;
          sum_squared_shared[ix] += f32_value * f32_value;
        }
        workgroupBarrier();

        var reduce_size : u32 = ${$};
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
        let mean = ${q("sum",_)} / f32(uniforms.hidden_size);
        let inv_std_dev = inverseSqrt(${q("square_sum",_)} / f32(uniforms.hidden_size) ${a?"":"- mean * mean"} + uniforms.epsilon);
        ${f?"mean_output[global_idx] = mean;":""}
        ${m?"inv_std_output[global_idx] = inv_std_dev;":""}

        for (var i: u32 = 0; i < stride; i++) {
          output[offset + i] = (output[offset + i] ${a?"":`- ${N}(mean)`}) *
            ${N}(inv_std_dev) * gamma[offset1d + i]
            ${p?"+ beta[offset1d + i]":""};
        }
      }`},x=[{dims:o,dataType:e[0].dataType}];return r>1&&x.push({dims:d,dataType:1}),r>2&&x.push({dims:d,dataType:1}),r>3&&x.push({dims:n,dataType:e[0].dataType}),{name:"SkipLayerNormalization",shaderCache:{hint:`${_};${f};${m};${y}`,inputDependencies:e.map((C,D)=>"type")},getShaderSource:S,getRunData:()=>({outputs:x,dispatchGroup:{x:Math.ceil(u/l)},programUniforms:w})}},sp=(e,t)=>{ap(e.inputs);let r=[0];e.outputCount>1&&r.push(-3),e.outputCount>2&&r.push(-3),e.outputCount>3&&r.push(3),e.compute(np(e.inputs,t,e.outputCount,!1),{outputs:r})}}),op,ma,up,Qn,lp,dp,pp,cp,ih=I(()=>{pe(),ae(),b(),re(),op=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");if(t.axes.length!==0){if(t.axes.length!==t.starts.length||t.axes.length!==t.ends.length)throw new Error("axes, starts and ends must have the same length")}else if(t.starts.length!==t.ends.length)throw new Error("starts and ends must have the same length");e.slice(1).forEach((r,i)=>{if(e[i+1].dataType!==6&&e[i+1].dataType!==7)throw new Error(`Input ${i} must be an array of int32 or int64`)})},ma=(e,t)=>{let r=[];if(e.length>t)if(e[t].dataType===7)e[t].getBigInt64Array().forEach(i=>r.push(Number(i)));else if(e[t].dataType===6)e[t].getInt32Array().forEach(i=>r.push(Number(i)));else throw new Error(`Input ${t} must be an array of int32 or int64`);return r},up=(e,t)=>{if(e.length>1){let r=ma(e,1),i=ma(e,2),a=ma(e,3);return a.length===0&&(a=[...Array(e[0].dims.length).keys()]),g({starts:r,ends:i,axes:a})}else return t},Qn=(e,t,r,i,a)=>{let n=e;return e<0&&(n+=r[i[t]]),a[t]<0?Math.max(0,Math.min(n,r[i[t]]-1)):Math.max(0,Math.min(n,r[i[t]]))},lp=(e,t,r)=>`fn calculateInputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
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
      }`,dp=(e,t)=>{let r=e[0].dims,i=U.size(r),a=t.axes.length>0?U.normalizeAxes(t.axes,r.length):[...Array(r.length).keys()],n=ma(e,4);n.forEach(_=>_!==0||(()=>{throw new Error("step cannot be 0")})),n.length===0&&(n=Array(a.length).fill(1));let s=t.starts.map((_,w)=>Qn(_,w,r,a,n)),o=t.ends.map((_,w)=>Qn(_,w,r,a,n));if(a.length!==s.length||a.length!==o.length)throw new Error("start, ends and axes should have the same number of elements");if(a.length!==r.length)for(let _=0;_<r.length;++_)a.includes(_)||(s.splice(_,0,0),o.splice(_,0,r[_]),n.splice(_,0,1));let u=n.map(_=>Math.sign(_));n.forEach((_,w,S)=>{if(_<0){let x=(o[w]-s[w])/_,C=s[w],D=C+x*n[w];s[w]=D,o[w]=C,S[w]=-_}});let l=r.slice(0);a.forEach((_,w)=>{l[_]=Math.ceil((o[_]-s[_])/n[_])});let d={dims:l,dataType:e[0].dataType},p=H("output",e[0].dataType,l.length),h=z("input",e[0].dataType,e[0].dims.length),f=U.size(l),m=[{name:"outputSize",type:"u32"},{name:"starts",type:"u32",length:s.length},{name:"signs",type:"i32",length:u.length},{name:"steps",type:"u32",length:n.length}],y=[{type:12,data:f},{type:12,data:s},{type:6,data:u},{type:12,data:n},...E(e[0].dims,l)],$=_=>`
      ${_.registerUniforms(m).declareVariables(h,p)}
        ${lp(h,p,r)}
        ${_.mainStart()}
          ${_.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
          let output_indices = ${p.offsetToIndices("global_idx")};
          let input_indices = calculateInputIndices(output_indices);
          ${p.setByOffset("global_idx",h.getByIndices("input_indices"))}
      }`;return{name:"Slice",shaderCache:{hint:`${u.length}_${s.length}_${n.length}`,inputDependencies:["rank"]},getShaderSource:$,getRunData:()=>({outputs:[d],dispatchGroup:{x:Math.ceil(i/64)},programUniforms:y})}},pp=(e,t)=>{op(e.inputs,t);let r=up(e.inputs,t);e.compute(dp(e.inputs,r),{inputs:[0]})},cp=e=>{let t=e.starts,r=e.ends,i=e.axes;return g({starts:t,ends:r,axes:i})}}),hp,fp,mp,gp,ah=I(()=>{pe(),ae(),b(),it(),re(),hp=e=>{if(!e||e.length!==1)throw new Error("Softmax op requires 1 input.")},fp=(e,t)=>{let r=e.inputs[0],i=r.dims,a=U.size(i),n=i.length,s=U.normalizeAxis(t.axis,n),o=s<i.length-1,u,l=[];o?(l=Array.from({length:n},(M,N)=>N),l[s]=n-1,l[n-1]=s,u=e.compute(pt(r,l),{inputs:[r],outputs:[-1]})[0]):u=r;let d=u.dims,p=d[n-1],h=a/p,f=O(p),m=p/f,y=64;h===1&&(y=256);let $=(M,N)=>N===4?`max(max(${M}.x, ${M}.y), max(${M}.z, ${M}.w))`:N===2?`max(${M}.x, ${M}.y)`:N===3?`max(max(${M}.x, ${M}.y), ${M}.z)`:M,_=z("x",u.dataType,u.dims,f),w=H("result",u.dataType,u.dims,f),S=_.type.value,x=A(u.dataType)==="f32"?`var threadMax = ${S}(-3.402823e+38f);`:`var threadMax = ${S}(-65504.0h);`,C=M=>`
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
          rowMaxShared = ${S}(${$("threadShared[0]",f)});
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
          rowSumShared = ${S}(${q("threadShared[0]",f)});
        }
        workgroupBarrier();

        // calculate final value for each element in the row
        for (var col = lindex; col < cols; col += wg) {
          var value = exp(getValue(row, col, row_stride) - rowMaxShared) / rowSumShared;
          // max operation protects against NaN since all values should be >=0
          value = max(value, ${S}(0.0));
          setValue(row, col, row_stride, value);
        }
      }`,D=e.compute({name:"Softmax",shaderCache:{hint:`${f};${y}`,inputDependencies:["type"]},getRunData:()=>({outputs:[{dims:d,dataType:u.dataType}],dispatchGroup:{x:h},programUniforms:[{type:6,data:m}]}),getShaderSource:C},{inputs:[u],outputs:[o?-1:0]})[0];o&&e.compute(pt(D,l),{inputs:[D]})},mp=(e,t)=>{hp(e.inputs),fp(e,t)},gp=e=>g({axis:e.axis})}),Xn,yp,wp,_p,bp,nh=I(()=>{pe(),ae(),re(),Xn=e=>Array.from(e.getBigInt64Array(),Number),yp=e=>{if(!e||e.length!==2)throw new Error("Tile requires 2 inputs.");if(e[0].dataType!==1&&e[0].dataType!==10&&e[0].dataType!==6&&e[0].dataType!==12)throw new Error("Tile only support float, float16, int32, and uint32 data types");if(e[1].dataType!==7)throw new Error("Tile `repeats` input should be of int64 data type");if(e[1].dims.length!==1)throw new Error("Tile `repeats` input should be 1-D");if(Xn(e[1]).length!==e[0].dims.length)throw new Error("Tile `repeats` input should have same number of elements as rank of input data tensor")},wp=(e,t)=>{let r=[];for(let i=0;i<e.length;++i)r.push(e[i]*t[i]);return r},_p=(e,t)=>{let r=e[0].dims,i=t??Xn(e[1]),a=wp(r,i),n=U.size(a),s=e[0].dataType,o=z("input",s,r.length),u=H("output",s,a.length),l=d=>`
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
    }`;return{name:"Tile",shaderCache:{hint:`${i}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:a,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:[{type:12,data:n},...E(e[0].dims,a)]}),getShaderSource:l}},bp=e=>{yp(e.inputs),e.compute(_p(e.inputs),{inputs:[0]})}}),$p,vp,xp,sh=I(()=>{pe(),ae(),re(),$p=(e,t,r,i,a)=>{let n=H("output_data",a,r.length,4),s=z("a_data",t[1].dataType,t[1].dims.length,4),o=z("b_data",t[2].dataType,t[2].dims.length,4),u=z("c_data",t[0].dataType,t[0].dims.length,4),l,d=(p,h,f)=>`select(${h}, ${p}, ${f})`;if(!i)l=n.setByOffset("global_idx",d(s.getByOffset("global_idx"),o.getByOffset("global_idx"),u.getByOffset("global_idx")));else{let p=(h,f,m="")=>{let y=`a_data[index_a${f}][component_a${f}]`,$=`b_data[index_b${f}][component_b${f}]`,_=`bool(c_data[index_c${f}] & (0xffu << (component_c${f} * 8)))`;return`
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
            ${h}[${f}] = ${m}(${d(y,$,_)});
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
      }`},vp=e=>{let t=e[1].dims,r=e[2].dims,i=e[0].dims,a=e[1].dataType,n=!(U.areEqual(t,r)&&U.areEqual(r,i)),s=t,o=U.size(t);if(n){let l=Ht.calcShape(Ht.calcShape(t,r,!1),i,!1);if(!l)throw new Error("Can't perform where op on the given tensors");s=l,o=U.size(s)}let u=Math.ceil(o/4);return{name:"Where",shaderCache:{inputDependencies:["rank","rank","rank"]},getShaderSource:l=>$p(l,e,s,n,a),getRunData:()=>({outputs:[{dims:s,dataType:a}],dispatchGroup:{x:Math.ceil(o/64/4)},programUniforms:[{type:12,data:u},...E(i,t,r,s)]})}},xp=e=>{e.compute(vp(e.inputs))}}),Sp,oh=I(()=>{$c(),hn(),vc(),xc(),Sc(),Tc(),Ec(),Ac(),Rc(),Bc(),Mc(),Dc(),Pc(),Uc(),Nc(),Lc(),Vc(),Wc(),Fc(),qc(),Gc(),jc(),Hc(),Kc(),Zc(),Dl(),Qc(),Xc(),Yc(),Jc(),eh(),dn(),th(),jl(),rh(),ih(),ah(),Fl(),nh(),it(),yn(),sh(),Sp=new Map([["Abs",[io]],["Acos",[ao]],["Acosh",[no]],["Add",[Ho]],["ArgMax",[Ws,cn]],["ArgMin",[Vs,cn]],["Asin",[so]],["Asinh",[oo]],["Atan",[uo]],["Atanh",[lo]],["Attention",[Ks]],["AveragePool",[vd,$d]],["BatchNormalization",[Ys]],["BiasAdd",[to]],["BiasSplitGelu",[qo]],["Cast",[co,po]],["Ceil",[mo]],["Clip",[fo]],["Concat",[ou,uu]],["Conv",[zn,In]],["ConvTranspose",[Mu,Ou]],["Cos",[go]],["Cosh",[yo]],["CumSum",[Pu,Uu]],["DepthToSpace",[Wu,Fu]],["DequantizeLinear",[Ad,Od]],["Div",[Ko]],["Einsum",[Zu,Qu]],["Elu",[wo,la]],["Equal",[Zo]],["Erf",[_o]],["Exp",[bo]],["Expand",[el]],["FastGelu",[rl]],["Floor",[$o]],["FusedConv",[zn,In]],["Gather",[sl,nl]],["GatherElements",[yl,gl]],["GatherBlockQuantized",[cl,hl]],["GatherND",[ul,ll]],["Gelu",[vo]],["Gemm",[$l,bl]],["GlobalAveragePool",[Sd,xd]],["GlobalMaxPool",[Id,kd]],["Greater",[Jo]],["GreaterOrEqual",[tu]],["GridSample",[zl,Al]],["GroupQueryAttention",[Ql]],["HardSigmoid",[zo,Co]],["InstanceNormalization",[Jl]],["LayerNormalization",[rd]],["LeakyRelu",[xo,la]],["Less",[eu]],["LessOrEqual",[ru]],["Log",[Uo]],["MatMul",[ad]],["MatMulNBits",[ud,ld]],["MaxPool",[Td,Ed]],["Mul",[Qo]],["MultiHeadAttention",[Ml,Rl]],["Neg",[To]],["Not",[So]],["Pad",[wd]],["Pow",[Xo]],["QuickGelu",[Vo,la]],["Range",[Md]],["Reciprocal",[Eo]],["ReduceMin",[Ds]],["ReduceMean",[As]],["ReduceMax",[Ms]],["ReduceSum",[Us]],["ReduceProd",[Ps]],["ReduceL1",[Os]],["ReduceL2",[Rs]],["ReduceLogSum",[Ls]],["ReduceLogSumExp",[Bs]],["ReduceSumSquare",[Ns]],["Relu",[ko]],["Resize",[rp,ip]],["RotaryEmbedding",[Gl]],["ScatterND",[Nd,Ud]],["Sigmoid",[Io]],["Sin",[Ao]],["Sinh",[Oo]],["Slice",[pp,cp]],["SkipLayerNormalization",[sp]],["Split",[Vl,Wl]],["Sqrt",[Ro]],["Softmax",[mp,gp]],["Sub",[Yo]],["Tan",[Bo]],["Tanh",[Mo]],["ThresholdedRelu",[Po,la]],["Tile",[bp]],["Transpose",[sa,Et]],["Where",[xp]]])}),Tp,uh=I(()=>{Qe(),Tt(),re(),Tp=class{constructor(e){this.backend=e,this.repo=new Map,this.attributesBound=!1}getArtifact(e){return this.repo.get(e)}setArtifact(e,t){this.repo.set(e,t)}run(e,t,r,i,a){Je(e.programInfo.name);let n=this.backend.device,s=this.backend.getComputePassEncoder();this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2);let o=[];for(let l of t)o.push({binding:o.length,resource:{buffer:l.buffer}});for(let l of r)o.push({binding:o.length,resource:{buffer:l.buffer}});a&&o.push({binding:o.length,resource:a});let u=n.createBindGroup({layout:e.computePipeline.getBindGroupLayout(0),entries:o,label:e.programInfo.name});if(this.backend.sessionStatus==="capturing"){let l={kernelId:this.backend.currentKernelId,computePipeline:e.computePipeline,bindGroup:u,dispatchGroup:i};this.backend.capturedCommandList.get(this.backend.currentSessionId).push(l)}s.setPipeline(e.computePipeline),s.setBindGroup(0,u),s.dispatchWorkgroups(...i),this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2+1),this.backend.pendingDispatchNumber++,(this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber||this.backend.queryType==="at-passes")&&this.backend.endComputePass(),this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber&&this.backend.flush(),Ze(e.programInfo.name)}dispose(){}build(e,t){Je(e.name);let r=this.backend.device,i=[];[{feature:"shader-f16",extension:"f16"},{feature:"subgroups",extension:"subgroups"}].forEach(l=>{r.features.has(l.feature)&&i.push(`enable ${l.extension};`)});let a=Re(t,this.backend.device.limits),n=e.getShaderSource(a),s=`${i.join(`
`)}
${a.additionalImplementations}
${n}`,o=r.createShaderModule({code:s,label:e.name});Te("verbose",()=>`[WebGPU] ${e.name} shader code: ${s}`);let u=r.createComputePipeline({compute:{module:o,entryPoint:"main"},layout:"auto",label:e.name});return Ze(e.name),{programInfo:e,computePipeline:u,uniformVariablesInfo:a.variablesInfo}}normalizeDispatchGroupSize(e){let t=typeof e=="number"?e:e.x,r=typeof e=="number"?1:e.y||1,i=typeof e=="number"?1:e.z||1,a=this.backend.device.limits.maxComputeWorkgroupsPerDimension;if(t<=a&&r<=a&&i<=a)return[t,r,i];let n=t*r*i,s=Math.ceil(Math.sqrt(n));if(s>a){if(s=Math.ceil(Math.cbrt(n)),s>a)throw new Error("Total dispatch size exceeds WebGPU maximum.");return[s,s,s]}else return[s,s,1]}}}),Ep={};ye(Ep,{WebGpuBackend:()=>zp});var kp,Ip,Cp,zp,lh=I(()=>{Qe(),pe(),Tt(),or(),un(),oh(),uh(),kp=(e,t)=>{if(t.length!==e.length)throw new Error(`inputDependencies length ${t.length} is not equal to inputTensors length ${e.length}.`);let r=[];for(let i=0;i<e.length;++i){let a=e[i].dataType;switch(t[i]){case"none":{r.push("");break}case"type":{r.push(`${a}`);break}case"rank":{let n=e[i].dims.length;r.push(`${a};${n}`);break}case"dims":{let n=e[i].dims.join(",");r.push(`${a};${n}`);break}default:throw new Error(`unsupported input dependency: ${t[i]}`)}}return r.join("|")},Ip=(e,t,r)=>{var a,n;let i=e.name;return(a=e.shaderCache)!=null&&a.hint&&(i+="["+e.shaderCache.hint+"]"),i+=":"+r+`:${kp(t,((n=e.shaderCache)==null?void 0:n.inputDependencies)??new Array(t.length).fill("dims"))}`,i},Cp=class{constructor(e){e&&(this.architecture=e.architecture,this.vendor=e.vendor)}isArchitecture(e){return this.architecture===e}isVendor(e){return this.vendor===e}},zp=class{constructor(){this.currentSessionId=null,this.currentKernelId=null,this.commandEncoder=null,this.computePassEncoder=null,this.maxDispatchNumber=16,this.pendingDispatchNumber=0,this.pendingKernels=[],this.pendingQueries=new Map,this.sessionStatus="default",this.capturedCommandList=new Map,this.capturedPendingKernels=new Map,this.sessionExternalDataMapping=new Map}get currentKernelCustomData(){if(this.currentKernelId===null)throw new Error("currentKernelCustomData(): currentKernelId is null. (should not happen)");let e=this.kernelCustomData.get(this.currentKernelId);return e||(e={},this.kernelCustomData.set(this.currentKernelId,e)),e}async initialize(e,t){this.env=e;let r=[],i={requiredLimits:{maxComputeWorkgroupStorageSize:t.limits.maxComputeWorkgroupStorageSize,maxComputeWorkgroupsPerDimension:t.limits.maxComputeWorkgroupsPerDimension,maxStorageBufferBindingSize:t.limits.maxStorageBufferBindingSize,maxBufferSize:t.limits.maxBufferSize,maxComputeInvocationsPerWorkgroup:t.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupSizeX:t.limits.maxComputeWorkgroupSizeX,maxComputeWorkgroupSizeY:t.limits.maxComputeWorkgroupSizeY,maxComputeWorkgroupSizeZ:t.limits.maxComputeWorkgroupSizeZ},requiredFeatures:r},a=n=>t.features.has(n)&&r.push(n)&&!0;a("chromium-experimental-timestamp-query-inside-passes")||a("timestamp-query"),a("shader-f16"),a("subgroups"),this.device=await t.requestDevice(i),this.adapterInfo=new Cp(t.info||await t.requestAdapterInfo()),this.gpuDataManager=Ea(this),this.programManager=new Tp(this),this.kernels=new Map,this.kernelPersistentData=new Map,this.kernelCustomData=new Map,si(e.logLevel,!!e.debug),this.device.onuncapturederror=n=>{n.error instanceof GPUValidationError&&console.error(`An uncaught WebGPU validation error was raised: ${n.error.message}`)},Object.defineProperty(this.env.webgpu,"device",{value:this.device,writable:!1,enumerable:!0,configurable:!1}),Object.defineProperty(this.env.webgpu,"adapter",{value:t,writable:!1,enumerable:!0,configurable:!1}),this.setQueryType()}dispose(){typeof this.querySet<"u"&&this.querySet.destroy(),this.gpuDataManager.dispose()}getCommandEncoder(){return this.commandEncoder||(this.commandEncoder=this.device.createCommandEncoder()),this.commandEncoder}getComputePassEncoder(){if(!this.computePassEncoder){let e=this.getCommandEncoder(),t={};this.queryType==="at-passes"&&(t.timestampWrites={querySet:this.querySet,beginningOfPassWriteIndex:this.pendingDispatchNumber*2,endOfPassWriteIndex:this.pendingDispatchNumber*2+1}),this.computePassEncoder=e.beginComputePass(t)}return this.computePassEncoder}endComputePass(){this.computePassEncoder&&(this.computePassEncoder.end(),this.computePassEncoder=null)}flush(){if(!this.commandEncoder)return;Je(),this.endComputePass();let e;this.queryType!=="none"&&(this.commandEncoder.resolveQuerySet(this.querySet,0,this.pendingDispatchNumber*2,this.queryResolveBuffer,0),e=this.device.createBuffer({size:this.pendingDispatchNumber*2*8,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),this.pendingQueries.set(e,this.pendingKernels),this.pendingKernels=[],this.commandEncoder.copyBufferToBuffer(this.queryResolveBuffer,0,e,0,this.pendingDispatchNumber*2*8)),this.device.queue.submit([this.commandEncoder.finish()]),this.gpuDataManager.refreshPendingBuffers(),this.commandEncoder=null,this.pendingDispatchNumber=0,this.queryType!=="none"&&e.mapAsync(GPUMapMode.READ).then(()=>{var i;let t=new BigUint64Array(e.getMappedRange()),r=this.pendingQueries.get(e);for(let a=0;a<t.length/2;a++){let n=r[a],s=n.kernelId,o=this.kernels.get(s),u=o.kernelType,l=o.kernelName,d=n.programName,p=n.inputTensorViews,h=n.outputTensorViews,f=t[a*2],m=t[a*2+1];typeof this.queryTimeBase>"u"&&(this.queryTimeBase=f);let y=Number(f-this.queryTimeBase),$=Number(m-this.queryTimeBase);if(!Number.isSafeInteger(y)||!Number.isSafeInteger($))throw new RangeError("incorrect timestamp range");if((i=this.env.webgpu.profiling)!=null&&i.ondata)this.env.webgpu.profiling.ondata({version:1,inputsMetadata:p.map(_=>({dims:_.dims,dataType:$t(_.dataType)})),outputsMetadata:h.map(_=>({dims:_.dims,dataType:$t(_.dataType)})),kernelId:s,kernelType:u,kernelName:l,programName:d,startTime:y,endTime:$});else{let _="";p.forEach((S,x)=>{_+=`input[${x}]: [${S.dims}] | ${$t(S.dataType)}, `});let w="";h.forEach((S,x)=>{w+=`output[${x}]: [${S.dims}] | ${$t(S.dataType)}, `}),console.log(`[profiling] kernel "${s}|${u}|${l}|${d}" ${_}${w}start time: ${y} ns, execution time: ${$-y} ns`)}Gt("GPU",`${d}::${f}::${m}`)}e.unmap(),this.pendingQueries.delete(e)}),Ze()}run(e,t,r,i,a,n){Je(e.name);let s=[];for(let w=0;w<t.length;++w){let S=t[w].data;if(S===0)continue;let x=this.gpuDataManager.get(S);if(!x)throw new Error(`no GPU data for input: ${S}`);s.push(x)}let{outputs:o,dispatchGroup:u,programUniforms:l}=e.getRunData(t),d=r.length===0?o.map((w,S)=>S):r;if(d.length!==o.length)throw new Error(`Output size ${d.length} must be equal to ${o.length}.`);let p=[],h=[];for(let w=0;w<o.length;++w){if(!Number.isInteger(d[w])||d[w]<-3||d[w]>=n)throw new Error(`Invalid output index: ${d[w]}`);if(d[w]===-3)continue;let S=d[w]===-1,x=d[w]===-2,C=S||x?a(o[w].dataType,o[w].dims):i(d[w],o[w].dataType,o[w].dims);if(p.push(C),C.data===0)continue;let D=this.gpuDataManager.get(C.data);if(!D)throw new Error(`no GPU data for output: ${C.data}`);if(S&&this.temporaryData.push(D),x){let M=this.kernelPersistentData.get(this.currentKernelId);M||(M=[],this.kernelPersistentData.set(this.currentKernelId,M)),M.push(D)}h.push(D)}if(s.length!==t.length||h.length!==p.length){if(h.length===0)return Ze(e.name),p;throw new Error(`Program ${e.name} has zero-sized tensor(s) in inputs or outputs. This is not supported now.`)}let f;if(l){let w=0,S=[];l.forEach(M=>{let N=typeof M.data=="number"?[M.data]:M.data;if(N.length===0)return;let V=M.type===10?2:4,Z,de;M.type===10?(de=N.length>4?16:N.length>2?8:N.length*V,Z=N.length>4?16:V*N.length):(de=N.length<=2?N.length*V:16,Z=16),w=Math.ceil(w/de)*de,S.push(w);let ee=M.type===10?8:4;w+=N.length>4?Math.ceil(N.length/ee)*Z:N.length*V});let x=16;w=Math.ceil(w/x)*x;let C=new ArrayBuffer(w);l.forEach((M,N)=>{let V=S[N],Z=typeof M.data=="number"?[M.data]:M.data;if(M.type===6)new Int32Array(C,V,Z.length).set(Z);else if(M.type===12)new Uint32Array(C,V,Z.length).set(Z);else if(M.type===10)new Uint16Array(C,V,Z.length).set(Z);else if(M.type===1)new Float32Array(C,V,Z.length).set(Z);else throw new Error(`Unsupported uniform type: ${$t(M.type)}`)});let D=this.gpuDataManager.create(w,GPUBufferUsage.COPY_DST|GPUBufferUsage.UNIFORM);this.device.queue.writeBuffer(D.buffer,0,C,0,w),this.gpuDataManager.release(D.id),f={offset:0,size:w,buffer:D.buffer}}let m=this.programManager.normalizeDispatchGroupSize(u),y=m[1]===1&&m[2]===1,$=Ip(e,t,y),_=this.programManager.getArtifact($);if(_||(_=this.programManager.build(e,m),this.programManager.setArtifact($,_),Te("info",()=>`[artifact] key: ${$}, programName: ${e.name}`)),l&&_.uniformVariablesInfo){if(l.length!==_.uniformVariablesInfo.length)throw new Error(`Uniform variables count mismatch: expect ${_.uniformVariablesInfo.length}, got ${l.length} in program "${_.programInfo.name}".`);for(let w=0;w<l.length;w++){let S=l[w],x=S.type,C=typeof S.data=="number"?1:S.data.length,[D,M]=_.uniformVariablesInfo[w];if(x!==D||C!==M)throw new Error(`Uniform variable ${w} mismatch: expect type ${D} with size ${M}, got type ${x} with size ${C} in program "${_.programInfo.name}".`)}}if(Te("info",()=>`[ProgramManager] run "${e.name}" (key=${$}) with ${m[0]}x${m[1]}x${m[2]}`),this.queryType!=="none"||this.sessionStatus==="capturing"){let w={kernelId:this.currentKernelId,programName:_.programInfo.name,inputTensorViews:t,outputTensorViews:p};this.pendingKernels.push(w),this.sessionStatus==="capturing"&&this.capturedPendingKernels.get(this.currentSessionId).push(w)}return this.programManager.run(_,s,h,m,f),Ze(e.name),p}upload(e,t){this.gpuDataManager.upload(e,t)}memcpy(e,t){this.gpuDataManager.memcpy(e,t)}async download(e,t){await this.gpuDataManager.download(e,t)}alloc(e){return this.gpuDataManager.create(e).id}free(e){return this.gpuDataManager.release(e)}createKernel(e,t,r,i){let a=Sp.get(e);if(!a)throw new Error(`kernel not implemented: ${e}`);let n={kernelType:e,kernelName:i,kernelEntry:a[0],attributes:[a[1],r]};this.kernels.set(t,n)}releaseKernel(e){let t=this.kernelPersistentData.get(e);if(t){for(let r of t)this.gpuDataManager.release(r.id);this.kernelPersistentData.delete(e)}this.kernelCustomData.delete(e),this.kernels.delete(e)}computeKernel(e,t,r){let i=this.kernels.get(e);if(!i)throw new Error(`kernel not created: ${e}`);let a=i.kernelType,n=i.kernelName,s=i.kernelEntry,o=i.attributes;if(this.currentKernelId!==null)throw new Error(`kernel "[${a}] ${n}" is not allowed to be called recursively`);this.currentKernelId=e,o[0]&&(o[1]=o[0](o[1]),o[0]=void 0),Te("info",()=>`[WebGPU] Start to run kernel "[${a}] ${n}"...`);let u=this.env.debug;this.temporaryData=[];try{return u&&this.device.pushErrorScope("validation"),s(t,o[1]),0}catch(l){return r.push(Promise.resolve(`[WebGPU] Kernel "[${a}] ${n}" failed. ${l}`)),1}finally{u&&r.push(this.device.popErrorScope().then(l=>l?`GPU validation error for kernel "[${a}] ${n}": ${l.message}`:null));for(let l of this.temporaryData)this.gpuDataManager.release(l.id);this.temporaryData=[],this.currentKernelId=null}}registerBuffer(e,t,r,i){let a=this.sessionExternalDataMapping.get(e);a||(a=new Map,this.sessionExternalDataMapping.set(e,a));let n=a.get(t),s=this.gpuDataManager.registerExternalBuffer(r,i,n);return a.set(t,[s,r]),s}unregisterBuffers(e){let t=this.sessionExternalDataMapping.get(e);t&&(t.forEach(r=>this.gpuDataManager.unregisterExternalBuffer(r[0])),this.sessionExternalDataMapping.delete(e))}getBuffer(e){let t=this.gpuDataManager.get(e);if(!t)throw new Error(`no GPU data for buffer: ${e}`);return t.buffer}createDownloader(e,t,r){return async()=>{let i=await aa(this,e,t);return Kt(i.buffer,r)}}writeTimestamp(e){this.queryType==="inside-passes"&&this.computePassEncoder.writeTimestamp(this.querySet,e)}setQueryType(){var e;this.queryType="none",(((e=this.env.webgpu.profiling)==null?void 0:e.mode)==="default"||(typeof this.env.trace>"u"?this.env.wasm.trace:this.env.trace))&&(this.device.features.has("chromium-experimental-timestamp-query-inside-passes")?this.queryType="inside-passes":this.device.features.has("timestamp-query")&&(this.queryType="at-passes"),this.queryType!=="none"&&typeof this.querySet>"u"&&(this.querySet=this.device.createQuerySet({type:"timestamp",count:this.maxDispatchNumber*2}),this.queryResolveBuffer=this.device.createBuffer({size:this.maxDispatchNumber*2*8,usage:GPUBufferUsage.COPY_SRC|GPUBufferUsage.QUERY_RESOLVE})))}captureBegin(){Te("info","captureBegin"),this.capturedCommandList.get(this.currentSessionId)||this.capturedCommandList.set(this.currentSessionId,[]),this.capturedPendingKernels.get(this.currentSessionId)||this.capturedPendingKernels.set(this.currentSessionId,[]),this.flush(),this.sessionStatus="capturing"}captureEnd(){Te("info","captureEnd"),this.flush(),this.sessionStatus="default"}replay(){Te("info","replay"),this.sessionStatus="replaying";let e=this.capturedCommandList.get(this.currentSessionId),t=this.capturedPendingKernels.get(this.currentSessionId),r=e.length;this.pendingKernels=[];for(let i=0;i<r;i++){let a=this.getComputePassEncoder(),n=e[i];this.writeTimestamp(this.pendingDispatchNumber*2),a.setPipeline(n.computePipeline),a.setBindGroup(0,n.bindGroup),a.dispatchWorkgroups(...n.dispatchGroup),this.writeTimestamp(this.pendingDispatchNumber*2+1),this.pendingDispatchNumber++,this.queryType!=="none"&&this.pendingKernels.push(t[i]),(this.pendingDispatchNumber>=this.maxDispatchNumber||this.queryType==="at-passes")&&this.endComputePass(),this.pendingDispatchNumber>=this.maxDispatchNumber&&this.flush()}this.flush(),this.sessionStatus="default"}onCreateSession(){this.gpuDataManager.onCreateSession()}onReleaseSession(e){this.unregisterBuffers(e),this.capturedCommandList.has(e)&&this.capturedCommandList.delete(e),this.capturedPendingKernels.has(e)&&this.capturedPendingKernels.delete(e),this.gpuDataManager.onReleaseSession(e)}onRunStart(e){this.currentSessionId=e,this.setQueryType()}}}),Ap={};ye(Ap,{init:()=>Rp});var Na,Op,Rp,dh=I(()=>{pe(),Tt(),ae(),ia(),Na=class dc{constructor(t,r,i,a){this.module=t,this.dataType=r,this.data=i,this.dims=a}getFloat32Array(){if(this.dataType!==1)throw new Error("Invalid data type");let t=U.size(this.dims);return t===0?new Float32Array:new Float32Array(this.module.HEAP8.buffer,this.data,t)}getBigInt64Array(){if(this.dataType!==7)throw new Error("Invalid data type");let t=U.size(this.dims);return t===0?new BigInt64Array:new BigInt64Array(this.module.HEAP8.buffer,this.data,t)}getInt32Array(){if(this.dataType!==6)throw new Error("Invalid data type");let t=U.size(this.dims);return t===0?new Int32Array:new Int32Array(this.module.HEAP8.buffer,this.data,t)}getUint16Array(){if(this.dataType!==10&&this.dataType!==4)throw new Error("Invalid data type");let t=U.size(this.dims);return t===0?new Uint16Array:new Uint16Array(this.module.HEAP8.buffer,this.data,t)}reshape(t){if(U.size(t)!==U.size(this.dims))throw new Error("Invalid new shape");return new dc(this.module,this.dataType,this.data,t)}},Op=class{constructor(e,t,r){this.module=e,this.backend=t,this.customDataOffset=0,this.customDataSize=0,this.adapterInfo=t.adapterInfo;let i=e.PTR_SIZE,a=r/e.PTR_SIZE,n=i===4?"i32":"i64";this.opKernelContext=Number(e.getValue(i*a++,n));let s=Number(e.getValue(i*a++,n));this.outputCount=Number(e.getValue(i*a++,n)),this.customDataOffset=Number(e.getValue(i*a++,"*")),this.customDataSize=Number(e.getValue(i*a++,n));let o=[];for(let u=0;u<s;u++){let l=Number(e.getValue(i*a++,n)),d=Number(e.getValue(i*a++,"*")),p=Number(e.getValue(i*a++,n)),h=[];for(let f=0;f<p;f++)h.push(Number(e.getValue(i*a++,n)));o.push(new Na(e,l,d,h))}this.inputs=o}get kernelCustomData(){return this.backend.currentKernelCustomData}get customDataBuffer(){return this.module.HEAPU8.subarray(this.customDataOffset,this.customDataOffset+this.customDataSize)}compute(e,t){var s;let r=((s=t==null?void 0:t.inputs)==null?void 0:s.map(o=>typeof o=="number"?this.inputs[o]:o))??this.inputs,i=(t==null?void 0:t.outputs)??[],a=(o,u,l)=>new Na(this.module,u,this.output(o,l),l),n=(o,u)=>{let l=vt(o,u);if(!l)throw new Error(`Unsupported data type: ${o}`);let d=l>0?this.backend.gpuDataManager.create(l).id:0;return new Na(this.module,o,d,u)};return this.backend.run(e,r,i,a,n,this.outputCount)}output(e,t){let r=this.module.stackSave();try{let i=this.module.PTR_SIZE,a=i===4?"i32":"i64",n=this.module.stackAlloc((1+t.length)*i);this.module.setValue(n,t.length,a);for(let s=0;s<t.length;s++)this.module.setValue(n+i*(s+1),t[s],a);return this.module._JsepOutput(this.opKernelContext,e,n)}catch(i){throw new Error(`Failed to generate kernel's output[${e}] with dims [${t}]. If you are running with pre-allocated output, please make sure the output type/dims are correct. Error: ${i}`)}finally{this.module.stackRestore(r)}}},Rp=async(e,t,r,i)=>{let a=t.jsepInit;if(!a)throw new Error("Failed to initialize JSEP. The WebAssembly module is not built with JSEP support.");if(e==="webgpu"){let n=(lh(),Le(Ep)).WebGpuBackend,s=new n;await s.initialize(r,i),a("webgpu",[s,o=>s.alloc(Number(o)),o=>s.free(o),(o,u,l,d=!1)=>{if(d)Te("verbose",()=>`[WebGPU] jsepCopyGpuToGpu: src=${Number(o)}, dst=${Number(u)}, size=${Number(l)}`),s.memcpy(Number(o),Number(u));else{Te("verbose",()=>`[WebGPU] jsepCopyCpuToGpu: dataOffset=${Number(o)}, gpuDataId=${Number(u)}, size=${Number(l)}`);let p=t.HEAPU8.subarray(Number(o>>>0),Number(o>>>0)+Number(l));s.upload(Number(u),p)}},async(o,u,l)=>{Te("verbose",()=>`[WebGPU] jsepCopyGpuToCpu: gpuDataId=${o}, dataOffset=${u}, size=${l}`),await s.download(Number(o),()=>t.HEAPU8.subarray(Number(u)>>>0,Number(u+l)>>>0))},(o,u,l)=>s.createKernel(o,Number(u),l,t.UTF8ToString(t._JsepGetNodeName(Number(u)))),o=>s.releaseKernel(o),(o,u,l,d)=>{Te("verbose",()=>`[WebGPU] jsepRun: sessionHandle=${l}, kernel=${o}, contextDataOffset=${u}`);let p=new Op(t,s,Number(u));return s.computeKernel(Number(o),p,d)},()=>s.captureBegin(),()=>s.captureEnd(),()=>s.replay()])}else{let n=new ra(r);a("webnn",[n,()=>n.reserveTensorId(),s=>n.releaseTensorId(s),async(s,o,u,l,d)=>n.ensureTensor(s,o,u,l,d),(s,o)=>{n.uploadTensor(s,o)},async(s,o)=>n.downloadTensor(s,o),(s,o)=>n.registerMLContext(s,o),!!r.trace])}}}),Bp,Yn,Jn,pr,Mp,es,La,ts,rs,is,as,ns,ss,Dp=I(()=>{Qe(),sn(),on(),pe(),_t(),Mr(),Qi(),Bp=(e,t)=>{he()._OrtInit(e,t)!==0&&le("Can't initialize onnxruntime.")},Yn=async e=>{Bp(e.wasm.numThreads,Pr(e.logLevel))},Jn=async(e,t)=>{var i,a;(a=(i=he()).asyncInit)==null||a.call(i);let r=e.webgpu.adapter;if(t==="webgpu"){if(typeof navigator>"u"||!navigator.gpu)throw new Error("WebGPU is not supported in current environment");if(r){if(typeof r.limits!="object"||typeof r.features!="object"||typeof r.requestDevice!="function")throw new Error("Invalid GPU adapter set in `env.webgpu.adapter`. It must be a GPUAdapter object.")}else{let n=e.webgpu.powerPreference;if(n!==void 0&&n!=="low-power"&&n!=="high-performance")throw new Error(`Invalid powerPreference setting: "${n}"`);let s=e.webgpu.forceFallbackAdapter;if(s!==void 0&&typeof s!="boolean")throw new Error(`Invalid forceFallbackAdapter setting: "${s}"`);if(r=await navigator.gpu.requestAdapter({powerPreference:n,forceFallbackAdapter:s}),!r)throw new Error('Failed to get GPU adapter. You may need to enable flag "--enable-unsafe-webgpu" if you are using Chrome.')}}if(t==="webnn"&&(typeof navigator>"u"||!navigator.ml))throw new Error("WebNN is not supported in current environment");{let n=(dh(),Le(Ap)).init;t==="webgpu"&&await n("webgpu",he(),e,r),t==="webnn"&&await n("webnn",he(),e)}},pr=new Map,Mp=e=>{let t=he(),r=t.stackSave();try{let i=t.PTR_SIZE,a=t.stackAlloc(2*i);t._OrtGetInputOutputCount(e,a,a+i)!==0&&le("Can't get session input/output count.");let n=i===4?"i32":"i64";return[Number(t.getValue(a,n)),Number(t.getValue(a+i,n))]}finally{t.stackRestore(r)}},es=(e,t)=>{let r=he(),i=r.stackSave(),a=0;try{let n=r.PTR_SIZE,s=r.stackAlloc(2*n);r._OrtGetInputOutputMetadata(e,t,s,s+n)!==0&&le("Can't get session input/output metadata.");let o=Number(r.getValue(s,"*"));a=Number(r.getValue(s+n,"*"));let u=r.HEAP32[a/4];if(u===0)return[o,0];let l=r.HEAPU32[a/4+1],d=[];for(let p=0;p<l;p++){let h=Number(r.getValue(a+8+p*n,"*"));d.push(h!==0?r.UTF8ToString(h):Number(r.getValue(a+8+(p+l)*n,"*")))}return[o,u,d]}finally{r.stackRestore(i),a!==0&&r._OrtFree(a)}},La=e=>{let t=he(),r=t._malloc(e.byteLength);if(r===0)throw new Error(`Can't create a session. failed to allocate a buffer of size ${e.byteLength}.`);return t.HEAPU8.set(e,r),[r,e.byteLength]},ts=async(e,t)=>{var p,h,f,m;let r,i,a=he();Array.isArray(e)?[r,i]=e:e.buffer===a.HEAPU8.buffer?[r,i]=[e.byteOffset,e.byteLength]:[r,i]=La(e);let n=0,s=0,o=0,u=[],l=[],d=[];try{if([s,u]=await Zi(t),(t==null?void 0:t.externalData)&&a.mountExternalData){let N=[];for(let V of t.externalData){let Z=typeof V=="string"?V:V.path;N.push(Lr(typeof V=="string"?V:V.data).then(de=>{a.mountExternalData(Z,de)}))}await Promise.all(N)}for(let N of(t==null?void 0:t.executionProviders)??[])if((typeof N=="string"?N:N.name)==="webnn"){if(a.shouldTransferToMLTensor=!1,typeof N!="string"){let V=N,Z=V==null?void 0:V.context,de=V==null?void 0:V.gpuDevice,ee=V==null?void 0:V.deviceType,ue=V==null?void 0:V.powerPreference;Z?a.currentContext=Z:de?a.currentContext=await a.webnnCreateMLContext(de):a.currentContext=await a.webnnCreateMLContext({deviceType:ee,powerPreference:ue})}else a.currentContext=await a.webnnCreateMLContext();break}n=await a._OrtCreateSession(r,i,s),(p=a.webgpuOnCreateSession)==null||p.call(a,n),n===0&&le("Can't create a session."),(h=a.jsepOnCreateSession)==null||h.call(a),a.currentContext&&(a.webnnRegisterMLContext(n,a.currentContext),a.currentContext=void 0,a.shouldTransferToMLTensor=!0);let[y,$]=Mp(n),_=!!(t!=null&&t.enableGraphCapture),w=[],S=[],x=[],C=[],D=[];for(let N=0;N<y;N++){let[V,Z,de]=es(n,N);V===0&&le("Can't get an input name."),l.push(V);let ee=a.UTF8ToString(V);w.push(ee),x.push(Z===0?{name:ee,isTensor:!1}:{name:ee,isTensor:!0,type:$t(Z),shape:de})}for(let N=0;N<$;N++){let[V,Z,de]=es(n,N+y);V===0&&le("Can't get an output name."),d.push(V);let ee=a.UTF8ToString(V);S.push(ee),C.push(Z===0?{name:ee,isTensor:!1}:{name:ee,isTensor:!0,type:$t(Z),shape:de});{if(_&&(t==null?void 0:t.preferredOutputLocation)===void 0){D.push("gpu-buffer");continue}let ue=typeof(t==null?void 0:t.preferredOutputLocation)=="string"?t.preferredOutputLocation:((f=t==null?void 0:t.preferredOutputLocation)==null?void 0:f[ee])??"cpu",ze=a.webnnIsGraphOutput;if(ue==="cpu"&&ze&&ze(n,ee)){D.push("ml-tensor-cpu-output");continue}if(ue!=="cpu"&&ue!=="cpu-pinned"&&ue!=="gpu-buffer"&&ue!=="ml-tensor")throw new Error(`Not supported preferred output location: ${ue}.`);if(_&&ue!=="gpu-buffer")throw new Error(`Not supported preferred output location: ${ue}. Only 'gpu-buffer' location is supported when enableGraphCapture is true.`);D.push(ue)}}let M=null;return D.some(N=>N==="gpu-buffer"||N==="ml-tensor"||N==="ml-tensor-cpu-output")&&(o=a._OrtCreateBinding(n),o===0&&le("Can't create IO binding."),M={handle:o,outputPreferredLocations:D,outputPreferredLocationsEncoded:D.map(N=>N==="ml-tensor-cpu-output"?"ml-tensor":N).map(N=>ii(N))}),pr.set(n,[n,l,d,M,_,!1]),[n,w,S,x,C]}catch(y){throw l.forEach($=>a._OrtFree($)),d.forEach($=>a._OrtFree($)),o!==0&&a._OrtReleaseBinding(o)!==0&&le("Can't release IO binding."),n!==0&&a._OrtReleaseSession(n)!==0&&le("Can't release session."),y}finally{a._free(r),s!==0&&a._OrtReleaseSessionOptions(s)!==0&&le("Can't release session options."),u.forEach(y=>a._free(y)),(m=a.unmountExternalData)==null||m.call(a)}},rs=e=>{var u,l,d;let t=he(),r=pr.get(e);if(!r)throw new Error(`cannot release session. invalid session id: ${e}`);let[i,a,n,s,o]=r;s&&(o&&t._OrtClearBoundOutputs(s.handle)!==0&&le("Can't clear bound outputs."),t._OrtReleaseBinding(s.handle)!==0&&le("Can't release IO binding.")),(u=t.jsepOnReleaseSession)==null||u.call(t,e),(l=t.webnnOnReleaseSession)==null||l.call(t,e),(d=t.webgpuOnReleaseSession)==null||d.call(t,e),a.forEach(p=>t._OrtFree(p)),n.forEach(p=>t._OrtFree(p)),t._OrtReleaseSession(i)!==0&&le("Can't release session."),pr.delete(e)},is=async(e,t,r,i,a,n,s=!1)=>{if(!e){t.push(0);return}let o=he(),u=o.PTR_SIZE,l=e[0],d=e[1],p=e[3],h=p,f,m;if(l==="string"&&(p==="gpu-buffer"||p==="ml-tensor"))throw new Error("String tensor is not supported on GPU.");if(s&&p!=="gpu-buffer")throw new Error(`External buffer must be provided for input/output index ${n} when enableGraphCapture is true.`);if(p==="gpu-buffer"){let _=e[2].gpuBuffer;m=vt(bt(l),d);{let w=o.jsepRegisterBuffer;if(!w)throw new Error('Tensor location "gpu-buffer" is not supported without using WebGPU.');f=w(i,n,_,m)}}else if(p==="ml-tensor"){let _=e[2].mlTensor;m=vt(bt(l),d);let w=o.webnnRegisterMLTensor;if(!w)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');f=w(i,_,bt(l),d)}else{let _=e[2];if(Array.isArray(_)){m=u*_.length,f=o._malloc(m),r.push(f);for(let w=0;w<_.length;w++){if(typeof _[w]!="string")throw new TypeError(`tensor data at index ${w} is not a string`);o.setValue(f+w*u,Fe(_[w],r),"*")}}else{let w=o.webnnIsGraphInput,S=o.webnnIsGraphOutput;if(l!=="string"&&w&&S){let x=o.UTF8ToString(a);if(w(i,x)||S(i,x)){let C=bt(l);m=vt(C,d),h="ml-tensor";let D=o.webnnCreateTemporaryTensor,M=o.webnnUploadTensor;if(!D||!M)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');let N=await D(i,C,d);M(N,new Uint8Array(_.buffer,_.byteOffset,_.byteLength)),f=N}else m=_.byteLength,f=o._malloc(m),r.push(f),o.HEAPU8.set(new Uint8Array(_.buffer,_.byteOffset,m),f)}else m=_.byteLength,f=o._malloc(m),r.push(f),o.HEAPU8.set(new Uint8Array(_.buffer,_.byteOffset,m),f)}}let y=o.stackSave(),$=o.stackAlloc(4*d.length);try{d.forEach((w,S)=>o.setValue($+S*u,w,u===4?"i32":"i64"));let _=o._OrtCreateTensor(bt(l),f,m,$,d.length,ii(h));_===0&&le(`Can't create tensor for input/output. session=${i}, index=${n}.`),t.push(_)}finally{o.stackRestore(y)}},as=async(e,t,r,i,a,n)=>{var de,ee,ue,ze;let s=he(),o=s.PTR_SIZE,u=pr.get(e);if(!u)throw new Error(`cannot run inference. invalid session id: ${e}`);let l=u[0],d=u[1],p=u[2],h=u[3],f=u[4],m=u[5],y=t.length,$=i.length,_=0,w=[],S=[],x=[],C=[],D=s.stackSave(),M=s.stackAlloc(y*o),N=s.stackAlloc(y*o),V=s.stackAlloc($*o),Z=s.stackAlloc($*o);try{[_,w]=qi(n),lt("wasm prepareInputOutputTensor");for(let ie=0;ie<y;ie++)await is(r[ie],S,C,e,d[t[ie]],t[ie],f);for(let ie=0;ie<$;ie++)await is(a[ie],x,C,e,p[i[ie]],y+i[ie],f);dt("wasm prepareInputOutputTensor");for(let ie=0;ie<y;ie++)s.setValue(M+ie*o,S[ie],"*"),s.setValue(N+ie*o,d[t[ie]],"*");for(let ie=0;ie<$;ie++)s.setValue(V+ie*o,x[ie],"*"),s.setValue(Z+ie*o,p[i[ie]],"*");if(h&&!m){let{handle:ie,outputPreferredLocations:fe,outputPreferredLocationsEncoded:st}=h;if(d.length!==y)throw new Error(`input count from feeds (${y}) is expected to be always equal to model's input count (${d.length}).`);lt("wasm bindInputsOutputs");for(let W=0;W<y;W++){let X=t[W];await s._OrtBindInput(ie,d[X],S[W])!==0&&le(`Can't bind input[${W}] for session=${e}.`)}for(let W=0;W<$;W++){let X=i[W];(de=a[W])!=null&&de[3]?s._OrtBindOutput(ie,p[X],x[W],0)!==0&&le(`Can't bind pre-allocated output[${W}] for session=${e}.`):s._OrtBindOutput(ie,p[X],0,st[X])!==0&&le(`Can't bind output[${W}] to ${fe[W]} for session=${e}.`)}dt("wasm bindInputsOutputs"),pr.set(e,[l,d,p,h,f,!0])}(ee=s.jsepOnRunStart)==null||ee.call(s,l),(ue=s.webnnOnRunStart)==null||ue.call(s,l);let be;h?be=await s._OrtRunWithBinding(l,h.handle,$,V,_):be=await s._OrtRun(l,N,M,y,Z,$,V,_),be!==0&&le("failed to call OrtRun().");let ne=[],ve=[];lt("wasm ProcessOutputTensor");for(let ie=0;ie<$;ie++){let fe=Number(s.getValue(V+ie*o,"*"));if(fe===x[ie]){ne.push(a[ie]);continue}let st=s.stackSave(),W=s.stackAlloc(4*o),X=!1,se,xe=0;try{s._OrtGetTensorData(fe,W,W+o,W+2*o,W+3*o)!==0&&le(`Can't access output tensor data on index ${ie}.`);let kt=o===4?"i32":"i64",$i=Number(s.getValue(W,kt));xe=s.getValue(W+o,"*");let Xp=s.getValue(W+o*2,"*"),mh=Number(s.getValue(W+o*3,kt)),hr=[];for(let nt=0;nt<mh;nt++)hr.push(Number(s.getValue(Xp+nt*o,kt)));s._OrtFree(Xp)!==0&&le("Can't free memory for tensor dims.");let fr=hr.reduce((nt,Ke)=>nt*Ke,1);se=$t($i);let wa=h==null?void 0:h.outputPreferredLocations[i[ie]];if(se==="string"){if(wa==="gpu-buffer"||wa==="ml-tensor")throw new Error("String tensor is not supported on GPU.");let nt=[];for(let Ke=0;Ke<fr;Ke++){let ar=s.getValue(xe+Ke*o,"*"),gh=s.getValue(xe+(Ke+1)*o,"*"),yh=Ke===fr-1?void 0:gh-ar;nt.push(s.UTF8ToString(ar,yh))}ne.push([se,hr,nt,"cpu"])}else if(wa==="gpu-buffer"&&fr>0){let nt=s.jsepGetBuffer;if(!nt)throw new Error('preferredLocation "gpu-buffer" is not supported without using WebGPU.');let Ke=nt(xe),ar=vt($i,fr);if(ar===void 0||!Ur(se))throw new Error(`Unsupported data type: ${se}`);X=!0,ne.push([se,hr,{gpuBuffer:Ke,download:s.jsepCreateDownloader(Ke,ar,se),dispose:()=>{s._OrtReleaseTensor(fe)!==0&&le("Can't release tensor.")}},"gpu-buffer"])}else if(wa==="ml-tensor"&&fr>0){let nt=s.webnnEnsureTensor,Ke=s.webnnIsGraphInputOutputTypeSupported;if(!nt||!Ke)throw new Error('preferredLocation "ml-tensor" is not supported without using WebNN.');if(vt($i,fr)===void 0||!Nr(se))throw new Error(`Unsupported data type: ${se}`);if(!Ke(e,se,!1))throw new Error(`preferredLocation "ml-tensor" for ${se} output is not supported by current WebNN Context.`);let ar=await nt(e,xe,$i,hr,!1);X=!0,ne.push([se,hr,{mlTensor:ar,download:s.webnnCreateMLTensorDownloader(xe,se),dispose:()=>{s.webnnReleaseTensorId(xe),s._OrtReleaseTensor(fe)}},"ml-tensor"])}else if(wa==="ml-tensor-cpu-output"&&fr>0){let nt=s.webnnCreateMLTensorDownloader(xe,se)(),Ke=ne.length;X=!0,ve.push((async()=>{let ar=[Ke,await nt];return s.webnnReleaseTensorId(xe),s._OrtReleaseTensor(fe),ar})()),ne.push([se,hr,[],"cpu"])}else{let nt=Dr(se),Ke=new nt(fr);new Uint8Array(Ke.buffer,Ke.byteOffset,Ke.byteLength).set(s.HEAPU8.subarray(xe,xe+Ke.byteLength)),ne.push([se,hr,Ke,"cpu"])}}finally{s.stackRestore(st),se==="string"&&xe&&s._free(xe),X||s._OrtReleaseTensor(fe)}}h&&!f&&(s._OrtClearBoundOutputs(h.handle)!==0&&le("Can't clear bound outputs."),pr.set(e,[l,d,p,h,f,!1]));for(let[ie,fe]of await Promise.all(ve))ne[ie][2]=fe;return dt("wasm ProcessOutputTensor"),ne}finally{(ze=s.webnnOnRunEnd)==null||ze.call(s,l),s.stackRestore(D),S.forEach(be=>s._OrtReleaseTensor(be)),x.forEach(be=>s._OrtReleaseTensor(be)),C.forEach(be=>s._free(be)),_!==0&&s._OrtReleaseRunOptions(_),w.forEach(be=>s._free(be))}},ns=e=>{let t=he(),r=pr.get(e);if(!r)throw new Error("invalid session id");let i=r[0],a=t._OrtEndProfiling(i);a===0&&le("Can't get an profile file name."),t._OrtFree(a)},ss=e=>{let t=[];for(let r of e){let i=r[2];!Array.isArray(i)&&"buffer"in i&&t.push(i.buffer)}return t}}),cr,St,bi,ga,ya,Va,os,Wa,Jr,ei,Pp,Up,Np,Lp,Vp,Wp,Fp,qp,Gp=I(()=>{Qe(),Dp(),_t(),Ar(),cr=()=>!!te.wasm.proxy&&typeof document<"u",bi=!1,ga=!1,ya=!1,Wa=new Map,Jr=(e,t)=>{let r=Wa.get(e);r?r.push(t):Wa.set(e,[t])},ei=()=>{if(bi||!ga||ya||!St)throw new Error("worker not ready")},Pp=e=>{switch(e.data.type){case"init-wasm":bi=!1,e.data.err?(ya=!0,os[1](e.data.err)):(ga=!0,os[0]()),Va&&(URL.revokeObjectURL(Va),Va=void 0);break;case"init-ep":case"copy-from":case"create":case"release":case"run":case"end-profiling":{let t=Wa.get(e.data.type);e.data.err?t.shift()[1](e.data.err):t.shift()[0](e.data.out);break}}},Up=async()=>{if(!ga){if(bi)throw new Error("multiple calls to 'initWasm()' detected.");if(ya)throw new Error("previous call to 'initWasm()' failed.");if(bi=!0,cr())return new Promise((e,t)=>{St==null||St.terminate(),Ni().then(([r,i])=>{try{St=i,St.onerror=n=>t(n),St.onmessage=Pp,os=[e,t];let a={type:"init-wasm",in:te};if(!a.in.wasm.wasmPaths&&r){let n=kr();n&&(a.in.wasm.wasmPaths=n)}St.postMessage(a),Va=r}catch(a){t(a)}},t)});try{await Br(te.wasm),await Yn(te),ga=!0}catch(e){throw ya=!0,e}finally{bi=!1}}},Np=async e=>{if(cr())return ei(),new Promise((t,r)=>{Jr("init-ep",[t,r]);let i={type:"init-ep",in:{epName:e,env:te}};St.postMessage(i)});await Jn(te,e)},Lp=async e=>cr()?(ei(),new Promise((t,r)=>{Jr("copy-from",[t,r]);let i={type:"copy-from",in:{buffer:e}};St.postMessage(i,[e.buffer])})):La(e),Vp=async(e,t)=>{if(cr()){if(t!=null&&t.preferredOutputLocation)throw new Error('session option "preferredOutputLocation" is not supported for proxy.');return ei(),new Promise((r,i)=>{Jr("create",[r,i]);let a={type:"create",in:{model:e,options:{...t}}},n=[];e instanceof Uint8Array&&n.push(e.buffer),St.postMessage(a,n)})}else return ts(e,t)},Wp=async e=>{if(cr())return ei(),new Promise((t,r)=>{Jr("release",[t,r]);let i={type:"release",in:e};St.postMessage(i)});rs(e)},Fp=async(e,t,r,i,a,n)=>{if(cr()){if(r.some(s=>s[3]!=="cpu"))throw new Error("input tensor on GPU is not supported for proxy.");if(a.some(s=>s))throw new Error("pre-allocated output tensor is not supported for proxy.");return ei(),new Promise((s,o)=>{Jr("run",[s,o]);let u=r,l={type:"run",in:{sessionId:e,inputIndices:t,inputs:u,outputIndices:i,options:n}};St.postMessage(l,ss(u))})}else return as(e,t,r,i,a,n)},qp=async e=>{if(cr())return ei(),new Promise((t,r)=>{Jr("end-profiling",[t,r]);let i={type:"end-profiling",in:e};St.postMessage(i)});ns(e)}}),us,jp,Hp,ph=I(()=>{Qe(),Gp(),pe(),Sr(),Qi(),us=(e,t)=>{switch(e.location){case"cpu":return[e.type,e.dims,e.data,"cpu"];case"gpu-buffer":return[e.type,e.dims,{gpuBuffer:e.gpuBuffer},"gpu-buffer"];case"ml-tensor":return[e.type,e.dims,{mlTensor:e.mlTensor},"ml-tensor"];default:throw new Error(`invalid data location: ${e.location} for ${t()}`)}},jp=e=>{switch(e[3]){case"cpu":return new We(e[0],e[2],e[1]);case"gpu-buffer":{let t=e[0];if(!Ur(t))throw new Error(`not supported data type: ${t} for deserializing GPU tensor`);let{gpuBuffer:r,download:i,dispose:a}=e[2];return We.fromGpuBuffer(r,{dataType:t,dims:e[1],download:i,dispose:a})}case"ml-tensor":{let t=e[0];if(!Nr(t))throw new Error(`not supported data type: ${t} for deserializing MLTensor tensor`);let{mlTensor:r,download:i,dispose:a}=e[2];return We.fromMLTensor(r,{dataType:t,dims:e[1],download:i,dispose:a})}default:throw new Error(`invalid data location: ${e[3]}`)}},Hp=class{async fetchModelAndCopyToWasmMemory(e){return Lp(await Lr(e))}async loadModel(e,t){Je();let r;typeof e=="string"?r=await this.fetchModelAndCopyToWasmMemory(e):r=e,[this.sessionId,this.inputNames,this.outputNames,this.inputMetadata,this.outputMetadata]=await Vp(r,t),Ze()}async dispose(){return Wp(this.sessionId)}async run(e,t,r){Je();let i=[],a=[];Object.entries(e).forEach(p=>{let h=p[0],f=p[1],m=this.inputNames.indexOf(h);if(m===-1)throw new Error(`invalid input '${h}'`);i.push(f),a.push(m)});let n=[],s=[];Object.entries(t).forEach(p=>{let h=p[0],f=p[1],m=this.outputNames.indexOf(h);if(m===-1)throw new Error(`invalid output '${h}'`);n.push(f),s.push(m)});let o=i.map((p,h)=>us(p,()=>`input "${this.inputNames[a[h]]}"`)),u=n.map((p,h)=>p?us(p,()=>`output "${this.outputNames[s[h]]}"`):null),l=await Fp(this.sessionId,a,o,s,u,r),d={};for(let p=0;p<l.length;p++)d[this.outputNames[s[p]]]=n[p]??jp(l[p]);return Ze(),d}startProfiling(){}endProfiling(){qp(this.sessionId)}}}),Kp={};ye(Kp,{OnnxruntimeWebAssemblyBackend:()=>ds,initializeFlags:()=>ls,wasmBackend:()=>Zp});var ls,ds,Zp,ch=I(()=>{Qe(),Gp(),ph(),ls=()=>{(typeof te.wasm.initTimeout!="number"||te.wasm.initTimeout<0)&&(te.wasm.initTimeout=0);let e=te.wasm.simd;if(typeof e!="boolean"&&e!==void 0&&e!=="fixed"&&e!=="relaxed"&&(console.warn(`Property "env.wasm.simd" is set to unknown value "${e}". Reset it to \`false\` and ignore SIMD feature checking.`),te.wasm.simd=!1),typeof te.wasm.proxy!="boolean"&&(te.wasm.proxy=!1),typeof te.wasm.trace!="boolean"&&(te.wasm.trace=!1),typeof te.wasm.numThreads!="number"||!Number.isInteger(te.wasm.numThreads)||te.wasm.numThreads<=0)if(typeof self<"u"&&!self.crossOriginIsolated)te.wasm.numThreads=1;else{let t=typeof navigator>"u"?oe("node:os").cpus().length:navigator.hardwareConcurrency;te.wasm.numThreads=Math.min(4,Math.ceil((t||1)/2))}},ds=class{async init(e){ls(),await Up(),await Np(e)}async createInferenceSessionHandler(e,t){let r=new Hp;return await r.loadModel(e,t),r}},Zp=new ds}),Qp={};ye(Qp,{InferenceSession:()=>xr,TRACE:()=>Gt,TRACE_EVENT_BEGIN:()=>lt,TRACE_EVENT_END:()=>dt,TRACE_FUNC_BEGIN:()=>Je,TRACE_FUNC_END:()=>Ze,Tensor:()=>We,default:()=>fh,env:()=>te,registerBackend:()=>we}),Qe(),Qe(),Qe();var hh="1.23.2",fh=Ai;{let e=(ch(),Le(Kp)).wasmBackend;we("webgpu",e,5),we("webnn",e,5),we("cpu",e,10),we("wasm",e,10)}return Object.defineProperty(te.versions,"web",{value:hh,enumerable:!0}),Le(Qp)})();/**
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
 */R.exports=G})(uc);var xh=uc.exports,ms={},pc={};Object.defineProperty(pc,"__esModule",{value:!0});var Ka={},cc;Object.defineProperty(Ka,"__esModule",{value:!0});Ka.SileroLegacy=void 0;const rc=yr;class gs{constructor(B,G,j,K,Y){this.ortInstance=B,this._session=G,this._h=j,this._c=K,this._sr=Y,this.reset_state=()=>{const Q=Array(128).fill(0);this._h=new this.ortInstance.Tensor("float32",Q,[2,1,64]),this._c=new this.ortInstance.Tensor("float32",Q,[2,1,64])},this.process=async Q=>{var Se;const I={input:new this.ortInstance.Tensor("float32",Q,[1,Q.length]),h:this._h,c:this._c,sr:this._sr},ye=await this._session.run(I);this._h=ye.hn,this._c=ye.cn;const[Ye]=(Se=ye.output)==null?void 0:Se.data;return{notSpeech:1-Ye,isSpeech:Ye}},this.release=async()=>{await this._session.release(),this._h.dispose(),this._c.dispose(),this._sr.dispose()}}}Ka.SileroLegacy=gs;cc=gs;gs.new=async(R,B)=>{rc.log.debug("initializing vad");const G=await B(),j=await R.InferenceSession.create(G),K=new R.Tensor("int64",[16000n]),Y=Array(2*64).fill(0),Q=new R.Tensor("float32",Y,[2,1,64]),oe=new R.Tensor("float32",Y,[2,1,64]);return rc.log.debug("vad is initialized"),new cc(R,j,Q,oe,K)};var Za={},hc;Object.defineProperty(Za,"__esModule",{value:!0});Za.SileroV5=void 0;const ic=yr;function fc(R){const B=Array(256).fill(0);return new R.Tensor("float32",B,[2,1,128])}class ys{constructor(B,G,j,K){this._session=B,this._state=G,this._sr=j,this.ortInstance=K,this.reset_state=()=>{this._state=fc(this.ortInstance)},this.process=async Y=>{var Le;const oe={input:new this.ortInstance.Tensor("float32",Y,[1,Y.length]),state:this._state,sr:this._sr},I=await this._session.run(oe);if(!I.stateN)throw new Error("No state from model");if(this._state=I.stateN,!((Le=I.output)!=null&&Le.data))throw new Error("No output from model");const ye=I.output.data[0];if(typeof ye!="number")throw new Error("Weird output data");return{notSpeech:1-ye,isSpeech:ye}},this.release=async()=>{await this._session.release(),this._state.dispose(),this._sr.dispose()}}}Za.SileroV5=ys;hc=ys;ys.new=async(R,B)=>{ic.log.debug("Loading VAD...");const G=await B(),j=await R.InferenceSession.create(G),K=new R.Tensor("int64",[16000n]),Y=fc(R);return ic.log.debug("...finished loading VAD"),new hc(j,Y,K,R)};(function(R){var B=ht&&ht.__createBinding||(Object.create?function(Y,Q,oe,I){I===void 0&&(I=oe);var ye=Object.getOwnPropertyDescriptor(Q,oe);(!ye||("get"in ye?!Q.__esModule:ye.writable||ye.configurable))&&(ye={enumerable:!0,get:function(){return Q[oe]}}),Object.defineProperty(Y,I,ye)}:function(Y,Q,oe,I){I===void 0&&(I=oe),Y[I]=Q[oe]}),G=ht&&ht.__exportStar||function(Y,Q){for(var oe in Y)oe!=="default"&&!Object.prototype.hasOwnProperty.call(Q,oe)&&B(Q,Y,oe)};Object.defineProperty(R,"__esModule",{value:!0}),R.SileroV5=R.SileroLegacy=void 0,G(pc,R);var j=Ka;Object.defineProperty(R,"SileroLegacy",{enumerable:!0,get:function(){return j.SileroLegacy}});var K=Za;Object.defineProperty(R,"SileroV5",{enumerable:!0,get:function(){return K.SileroV5}})})(ms);var Sa={};Object.defineProperty(Sa,"__esModule",{value:!0});Sa.Resampler=void 0;const Sh=yr;class Th{constructor(B){this.options=B,this.process=G=>{const j=[];for(const K of G)for(this.inputBuffer.push(K);this.hasEnoughDataForFrame();){const Y=this.generateOutputFrame();j.push(Y)}return j},B.nativeSampleRate<16e3&&Sh.log.error("nativeSampleRate is too low. Should have 16000 = targetSampleRate <= nativeSampleRate"),this.inputBuffer=[]}async*stream(B){for(const G of B)for(this.inputBuffer.push(G);this.hasEnoughDataForFrame();)yield this.generateOutputFrame()}hasEnoughDataForFrame(){return this.inputBuffer.length*this.options.targetSampleRate/this.options.nativeSampleRate>=this.options.targetFrameSize}generateOutputFrame(){const B=new Float32Array(this.options.targetFrameSize);let G=0,j=0;for(;G<this.options.targetFrameSize;){let K=0,Y=0;for(;j<Math.min(this.inputBuffer.length,(G+1)*this.options.nativeSampleRate/this.options.targetSampleRate);){const Q=this.inputBuffer[j];Q!==void 0&&(K+=Q,Y++),j++}B[G]=K/Y,G++}return this.inputBuffer=this.inputBuffer.slice(j),B}}Sa.Resampler=Th;(function(R){var B=ht&&ht.__createBinding||(Object.create?function(Se,$e,we,Pe){Pe===void 0&&(Pe=we);var Ge=Object.getOwnPropertyDescriptor($e,we);(!Ge||("get"in Ge?!$e.__esModule:Ge.writable||Ge.configurable))&&(Ge={enumerable:!0,get:function(){return $e[we]}}),Object.defineProperty(Se,Pe,Ge)}:function(Se,$e,we,Pe){Pe===void 0&&(Pe=we),Se[Pe]=$e[we]}),G=ht&&ht.__setModuleDefault||(Object.create?function(Se,$e){Object.defineProperty(Se,"default",{enumerable:!0,value:$e})}:function(Se,$e){Se.default=$e}),j=ht&&ht.__importStar||function(Se){if(Se&&Se.__esModule)return Se;var $e={};if(Se!=null)for(var we in Se)we!=="default"&&Object.prototype.hasOwnProperty.call(Se,we)&&B($e,Se,we);return G($e,Se),$e};Object.defineProperty(R,"__esModule",{value:!0}),R.NonRealTimeVAD=R.defaultNonRealTimeVADOptions=void 0;const K=j(xh),Y=xa,Q=xi,oe=Yt,I=ri,ye=ms,Ye=Sa;R.defaultNonRealTimeVADOptions={...oe.defaultFrameProcessorOptions,modelURL:Y.baseAssetPath+"silero_vad_legacy.onnx",modelFetcher:Q.defaultModelFetcher};class Le{static async new($e={}){const we={...R.defaultNonRealTimeVADOptions,...$e};(0,oe.validateOptions)(we),we.ortConfig!==void 0&&we.ortConfig(K);const Pe=()=>we.modelFetcher(we.modelURL),Ge=await ye.SileroLegacy.new(K,Pe),yt=new oe.FrameProcessor(Ge.process,Ge.reset_state,{positiveSpeechThreshold:we.positiveSpeechThreshold,negativeSpeechThreshold:we.negativeSpeechThreshold,redemptionMs:we.redemptionMs,preSpeechPadMs:we.preSpeechPadMs,minSpeechMs:we.minSpeechMs,submitUserSpeechOnPause:we.submitUserSpeechOnPause},1536/16);return yt.resume(),new this(Pe,K,we,yt)}constructor($e,we,Pe,Ge){this.modelFetcher=$e,this.ort=we,this.options=Pe,this.frameProcessor=Ge,this.frameSamples=1536}async*run($e,we){const Pe={nativeSampleRate:we,targetSampleRate:16e3,targetFrameSize:this.frameSamples},Ge=new Ye.Resampler(Pe);let yt=0,At=0,ke=0;for await(const me of Ge.stream($e)){const ce=[];await this.frameProcessor.process(me,Ne=>{ce.push(Ne)});for(const Ne of ce)switch(Ne.msg){case I.Message.SpeechStart:yt=ke*this.frameSamples/16;break;case I.Message.SpeechEnd:At=(ke+1)*this.frameSamples/16,yield{audio:Ne.audio,start:yt,end:At};break}ke++}const Ie=[];this.frameProcessor.endSegment(me=>{Ie.push(me)});for(const me of Ie)switch(me.msg){case I.Message.SpeechEnd:yield{audio:me.audio,start:yt,end:ke*this.frameSamples/16}}}}R.NonRealTimeVAD=Le})(oc);var Xt={};Object.defineProperty(Xt,"__esModule",{value:!0});Xt.audioFileToArray=Xt.encodeWAV=Xt.arrayBufferToBase64=Xt.minFramesForTargetMS=void 0;function Eh(R,B,G=16e3){return Math.ceil(R*G/1e3/B)}Xt.minFramesForTargetMS=Eh;function kh(R){const B=new Uint8Array(R),G=B.byteLength,j=new Array(G);for(let K=0;K<G;K++){const Y=B[K];if(Y===void 0)break;j[K]=String.fromCharCode(Y)}return btoa(j.join(""))}Xt.arrayBufferToBase64=kh;function Ih(R,B=3,G=16e3,j=1,K=32){const Y=K/8,Q=j*Y,oe=new ArrayBuffer(44+R.length*Y),I=new DataView(oe);return Fa(I,0,"RIFF"),I.setUint32(4,36+R.length*Y,!0),Fa(I,8,"WAVE"),Fa(I,12,"fmt "),I.setUint32(16,16,!0),I.setUint16(20,B,!0),I.setUint16(22,j,!0),I.setUint32(24,G,!0),I.setUint32(28,G*Q,!0),I.setUint16(32,Q,!0),I.setUint16(34,K,!0),Fa(I,36,"data"),I.setUint32(40,R.length*Y,!0),B===1?zh(I,44,R):Ch(I,44,R),oe}Xt.encodeWAV=Ih;function Ch(R,B,G){for(let j=0;j<G.length;j++,B+=4)R.setFloat32(B,G[j],!0)}function zh(R,B,G){for(let j=0;j<G.length;j++,B+=2){const K=Math.max(-1,Math.min(1,G[j]));R.setInt16(B,K<0?K*32768:K*32767,!0)}}function Fa(R,B,G){for(let j=0;j<G.length;j++)R.setUint8(B+j,G.charCodeAt(j))}async function Ah(R){const B=new OfflineAudioContext(1,1,44100),G=new FileReader;let j=null;if(await new Promise(Q=>{G.addEventListener("loadend",()=>{const oe=G.result;B.decodeAudioData(oe,I=>{j=I,B.startRendering().then(()=>{console.log("Rendering completed successfully"),Q()}).catch(ye=>{console.error("Rendering failed: ",ye)})},I=>{console.log("Error with decoding audio data: ",I)})}),G.readAsArrayBuffer(R)}),j===null)throw Error("some shit");const K=j,Y=new Float32Array(K.length);for(let Q=0;Q<K.length;Q++)for(let oe=0;oe<K.numberOfChannels;oe++){const I=K.getChannelData(oe)[Q],ye=Y[Q];if(I===void 0||ye===void 0)throw new Error("sample or out[i] is undefined");Y[Q]=ye+I}return{audio:Y,sampleRate:K.sampleRate}}Xt.audioFileToArray=Ah;var mc={},gc={exports:{}};/*!
 * ONNX Runtime Web v1.23.2
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */(function(R,B){var G=(()=>{var j=Object.defineProperty,K=Object.getOwnPropertyDescriptor,Y=Object.getOwnPropertyNames,Q=Object.prototype.hasOwnProperty,oe=(c=>typeof zt<"u"?zt:typeof Proxy<"u"?new Proxy(c,{get:(g,b)=>(typeof zt<"u"?zt:g)[b]}):c)(function(c){if(typeof zt<"u")return zt.apply(this,arguments);throw Error('Dynamic require of "'+c+'" is not supported')}),I=(c,g)=>()=>(c&&(g=c(c=0)),g),ye=(c,g)=>{for(var b in g)j(c,b,{get:g[b],enumerable:!0})},Ye=(c,g,b,T)=>{if(g&&typeof g=="object"||typeof g=="function")for(let v of Y(g))!Q.call(c,v)&&v!==b&&j(c,v,{get:()=>g[v],enumerable:!(T=K(g,v))||T.enumerable});return c},Le=c=>Ye(j({},"__esModule",{value:!0}),c),Se,$e,we,Pe,Ge,yt=I(()=>{Se=new Map,$e=[],we=(c,g,b)=>{if(g&&typeof g.init=="function"&&typeof g.createInferenceSessionHandler=="function"){let T=Se.get(c);if(T===void 0)Se.set(c,{backend:g,priority:b});else{if(T.priority>b)return;if(T.priority===b&&T.backend!==g)throw new Error(`cannot register backend "${c}" using priority ${b}`)}if(b>=0){let v=$e.indexOf(c);v!==-1&&$e.splice(v,1);for(let A=0;A<$e.length;A++)if(Se.get($e[A]).priority<=b){$e.splice(A,0,c);return}$e.push(c)}return}throw new TypeError("not a valid backend")},Pe=async c=>{let g=Se.get(c);if(!g)return"backend not found.";if(g.initialized)return g.backend;if(g.aborted)return g.error;{let b=!!g.initPromise;try{return b||(g.initPromise=g.backend.init(c)),await g.initPromise,g.initialized=!0,g.backend}catch(T){return b||(g.error=`${T}`,g.aborted=!0),g.error}finally{delete g.initPromise}}},Ge=async c=>{let g=c.executionProviders||[],b=g.map(O=>typeof O=="string"?O:O.name),T=b.length===0?$e:b,v,A=[],k=new Set;for(let O of T){let L=await Pe(O);typeof L=="string"?A.push({name:O,err:L}):(v||(v=L),v===L&&k.add(O))}if(!v)throw new Error(`no available backend found. ERR: ${A.map(O=>`[${O.name}] ${O.err}`).join(", ")}`);for(let{name:O,err:L}of A)b.includes(O)&&console.warn(`removing requested execution provider "${O}" from session options because it is not available: ${L}`);let E=g.filter(O=>k.has(typeof O=="string"?O:O.name));return[v,new Proxy(c,{get:(O,L)=>L==="executionProviders"?E:Reflect.get(O,L)})]}}),At=I(()=>{yt()}),ke,Ie=I(()=>{ke="1.23.2"}),me,ce,Ne=I(()=>{Ie(),me="warning",ce={wasm:{},webgl:{},webgpu:{},versions:{common:ke},set logLevel(c){if(c!==void 0){if(typeof c!="string"||["verbose","info","warning","error","fatal"].indexOf(c)===-1)throw new Error(`Unsupported logging level: ${c}`);me=c}},get logLevel(){return me}},Object.defineProperty(ce,"logLevel",{enumerable:!0})}),te,ot=I(()=>{Ne(),te=ce}),qe,ft,nr=I(()=>{qe=(c,g)=>{let b=typeof document<"u"?document.createElement("canvas"):new OffscreenCanvas(1,1);b.width=c.dims[3],b.height=c.dims[2];let T=b.getContext("2d");if(T!=null){let v,A;(g==null?void 0:g.tensorLayout)!==void 0&&g.tensorLayout==="NHWC"?(v=c.dims[2],A=c.dims[3]):(v=c.dims[3],A=c.dims[2]);let k=(g==null?void 0:g.format)!==void 0?g.format:"RGB",E=g==null?void 0:g.norm,O,L;E===void 0||E.mean===void 0?O=[255,255,255,255]:typeof E.mean=="number"?O=[E.mean,E.mean,E.mean,E.mean]:(O=[E.mean[0],E.mean[1],E.mean[2],0],E.mean[3]!==void 0&&(O[3]=E.mean[3])),E===void 0||E.bias===void 0?L=[0,0,0,0]:typeof E.bias=="number"?L=[E.bias,E.bias,E.bias,E.bias]:(L=[E.bias[0],E.bias[1],E.bias[2],0],E.bias[3]!==void 0&&(L[3]=E.bias[3]));let F=A*v,q=0,P=F,J=F*2,z=-1;k==="RGBA"?(q=0,P=F,J=F*2,z=F*3):k==="RGB"?(q=0,P=F,J=F*2):k==="RBG"&&(q=0,J=F,P=F*2);for(let H=0;H<A;H++)for(let Ue=0;Ue<v;Ue++){let _e=(c.data[q++]-L[0])*O[0],ge=(c.data[P++]-L[1])*O[1],Re=(c.data[J++]-L[2])*O[2],re=z===-1?255:(c.data[z++]-L[3])*O[3];T.fillStyle="rgba("+_e+","+ge+","+Re+","+re+")",T.fillRect(Ue,H,1,1)}if("toDataURL"in b)return b.toDataURL();throw new Error("toDataURL is not supported")}else throw new Error("Can not access image data")},ft=(c,g)=>{let b=typeof document<"u"?document.createElement("canvas").getContext("2d"):new OffscreenCanvas(1,1).getContext("2d"),T;if(b!=null){let v,A,k;(g==null?void 0:g.tensorLayout)!==void 0&&g.tensorLayout==="NHWC"?(v=c.dims[2],A=c.dims[1],k=c.dims[3]):(v=c.dims[3],A=c.dims[2],k=c.dims[1]);let E=g!==void 0&&g.format!==void 0?g.format:"RGB",O=g==null?void 0:g.norm,L,F;O===void 0||O.mean===void 0?L=[255,255,255,255]:typeof O.mean=="number"?L=[O.mean,O.mean,O.mean,O.mean]:(L=[O.mean[0],O.mean[1],O.mean[2],255],O.mean[3]!==void 0&&(L[3]=O.mean[3])),O===void 0||O.bias===void 0?F=[0,0,0,0]:typeof O.bias=="number"?F=[O.bias,O.bias,O.bias,O.bias]:(F=[O.bias[0],O.bias[1],O.bias[2],0],O.bias[3]!==void 0&&(F[3]=O.bias[3]));let q=A*v;if(g!==void 0&&(g.format!==void 0&&k===4&&g.format!=="RGBA"||k===3&&g.format!=="RGB"&&g.format!=="BGR"))throw new Error("Tensor format doesn't match input tensor dims");let P=4,J=0,z=1,H=2,Ue=3,_e=0,ge=q,Re=q*2,re=-1;E==="RGBA"?(_e=0,ge=q,Re=q*2,re=q*3):E==="RGB"?(_e=0,ge=q,Re=q*2):E==="RBG"&&(_e=0,Re=q,ge=q*2),T=b.createImageData(v,A);for(let De=0;De<A*v;J+=P,z+=P,H+=P,Ue+=P,De++)T.data[J]=(c.data[_e++]-F[0])*L[0],T.data[z]=(c.data[ge++]-F[1])*L[1],T.data[H]=(c.data[Re++]-F[2])*L[2],T.data[Ue]=re===-1?255:(c.data[re++]-F[3])*L[3]}else throw new Error("Can not access image data");return T}}),ut,wt,wr,_r,Oe,It,Si=I(()=>{$r(),ut=(c,g)=>{if(c===void 0)throw new Error("Image buffer must be defined");if(g.height===void 0||g.width===void 0)throw new Error("Image height and width must be defined");if(g.tensorLayout==="NHWC")throw new Error("NHWC Tensor layout is not supported yet");let{height:b,width:T}=g,v=g.norm??{mean:255,bias:0},A,k;typeof v.mean=="number"?A=[v.mean,v.mean,v.mean,v.mean]:A=[v.mean[0],v.mean[1],v.mean[2],v.mean[3]??255],typeof v.bias=="number"?k=[v.bias,v.bias,v.bias,v.bias]:k=[v.bias[0],v.bias[1],v.bias[2],v.bias[3]??0];let E=g.format!==void 0?g.format:"RGBA",O=g.tensorFormat!==void 0&&g.tensorFormat!==void 0?g.tensorFormat:"RGB",L=b*T,F=O==="RGBA"?new Float32Array(L*4):new Float32Array(L*3),q=4,P=0,J=1,z=2,H=3,Ue=0,_e=L,ge=L*2,Re=-1;E==="RGB"&&(q=3,P=0,J=1,z=2,H=-1),O==="RGBA"?Re=L*3:O==="RBG"?(Ue=0,ge=L,_e=L*2):O==="BGR"&&(ge=0,_e=L,Ue=L*2);for(let re=0;re<L;re++,P+=q,z+=q,J+=q,H+=q)F[Ue++]=(c[P]+k[0])/A[0],F[_e++]=(c[J]+k[1])/A[1],F[ge++]=(c[z]+k[2])/A[2],Re!==-1&&H!==-1&&(F[Re++]=(c[H]+k[3])/A[3]);return O==="RGBA"?new Be("float32",F,[1,4,b,T]):new Be("float32",F,[1,3,b,T])},wt=async(c,g)=>{let b=typeof HTMLImageElement<"u"&&c instanceof HTMLImageElement,T=typeof ImageData<"u"&&c instanceof ImageData,v=typeof ImageBitmap<"u"&&c instanceof ImageBitmap,A=typeof c=="string",k,E=g??{},O=()=>{if(typeof document<"u")return document.createElement("canvas");if(typeof OffscreenCanvas<"u")return new OffscreenCanvas(1,1);throw new Error("Canvas is not supported")},L=F=>typeof HTMLCanvasElement<"u"&&F instanceof HTMLCanvasElement||F instanceof OffscreenCanvas?F.getContext("2d"):null;if(b){let F=O();F.width=c.width,F.height=c.height;let q=L(F);if(q!=null){let P=c.height,J=c.width;if(g!==void 0&&g.resizedHeight!==void 0&&g.resizedWidth!==void 0&&(P=g.resizedHeight,J=g.resizedWidth),g!==void 0){if(E=g,g.tensorFormat!==void 0)throw new Error("Image input config format must be RGBA for HTMLImageElement");E.tensorFormat="RGBA",E.height=P,E.width=J}else E.tensorFormat="RGBA",E.height=P,E.width=J;q.drawImage(c,0,0),k=q.getImageData(0,0,J,P).data}else throw new Error("Can not access image data")}else if(T){let F,q;if(g!==void 0&&g.resizedWidth!==void 0&&g.resizedHeight!==void 0?(F=g.resizedHeight,q=g.resizedWidth):(F=c.height,q=c.width),g!==void 0&&(E=g),E.format="RGBA",E.height=F,E.width=q,g!==void 0){let P=O();P.width=q,P.height=F;let J=L(P);if(J!=null)J.putImageData(c,0,0),k=J.getImageData(0,0,q,F).data;else throw new Error("Can not access image data")}else k=c.data}else if(v){if(g===void 0)throw new Error("Please provide image config with format for Imagebitmap");let F=O();F.width=c.width,F.height=c.height;let q=L(F);if(q!=null){let P=c.height,J=c.width;return q.drawImage(c,0,0,J,P),k=q.getImageData(0,0,J,P).data,E.height=P,E.width=J,ut(k,E)}else throw new Error("Can not access image data")}else{if(A)return new Promise((F,q)=>{let P=O(),J=L(P);if(!c||!J)return q();let z=new Image;z.crossOrigin="Anonymous",z.src=c,z.onload=()=>{P.width=z.width,P.height=z.height,J.drawImage(z,0,0,P.width,P.height);let H=J.getImageData(0,0,P.width,P.height);E.height=P.height,E.width=P.width,F(ut(H.data,E))}});throw new Error("Input data provided is not supported - aborted tensor creation")}if(k!==void 0)return ut(k,E);throw new Error("Input data provided is not supported - aborted tensor creation")},wr=(c,g)=>{let{width:b,height:T,download:v,dispose:A}=g,k=[1,T,b,4];return new Be({location:"texture",type:"float32",texture:c,dims:k,download:v,dispose:A})},_r=(c,g)=>{let{dataType:b,dims:T,download:v,dispose:A}=g;return new Be({location:"gpu-buffer",type:b??"float32",gpuBuffer:c,dims:T,download:v,dispose:A})},Oe=(c,g)=>{let{dataType:b,dims:T,download:v,dispose:A}=g;return new Be({location:"ml-tensor",type:b??"float32",mlTensor:c,dims:T,download:v,dispose:A})},It=(c,g,b)=>new Be({location:"cpu-pinned",type:c,data:g,dims:b??[g.length]})}),tt,Ot,br,Ti,Qa=I(()=>{tt=new Map([["float32",Float32Array],["uint8",Uint8Array],["int8",Int8Array],["uint16",Uint16Array],["int16",Int16Array],["int32",Int32Array],["bool",Uint8Array],["float64",Float64Array],["uint32",Uint32Array],["int4",Uint8Array],["uint4",Uint8Array]]),Ot=new Map([[Float32Array,"float32"],[Uint8Array,"uint8"],[Int8Array,"int8"],[Uint16Array,"uint16"],[Int16Array,"int16"],[Int32Array,"int32"],[Float64Array,"float64"],[Uint32Array,"uint32"]]),br=!1,Ti=()=>{if(!br){br=!0;let c=typeof BigInt64Array<"u"&&BigInt64Array.from,g=typeof BigUint64Array<"u"&&BigUint64Array.from,b=globalThis.Float16Array,T=typeof b<"u"&&b.from;c&&(tt.set("int64",BigInt64Array),Ot.set(BigInt64Array,"int64")),g&&(tt.set("uint64",BigUint64Array),Ot.set(BigUint64Array,"uint64")),T?(tt.set("float16",b),Ot.set(b,"float16")):tt.set("float16",Uint16Array)}}}),Ei,ki,Xa=I(()=>{$r(),Ei=c=>{let g=1;for(let b=0;b<c.length;b++){let T=c[b];if(typeof T!="number"||!Number.isSafeInteger(T))throw new TypeError(`dims[${b}] must be an integer, got: ${T}`);if(T<0)throw new RangeError(`dims[${b}] must be a non-negative integer, got: ${T}`);g*=T}return g},ki=(c,g)=>{switch(c.location){case"cpu":return new Be(c.type,c.data,g);case"cpu-pinned":return new Be({location:"cpu-pinned",data:c.data,type:c.type,dims:g});case"texture":return new Be({location:"texture",texture:c.texture,type:c.type,dims:g});case"gpu-buffer":return new Be({location:"gpu-buffer",gpuBuffer:c.gpuBuffer,type:c.type,dims:g});case"ml-tensor":return new Be({location:"ml-tensor",mlTensor:c.mlTensor,type:c.type,dims:g});default:throw new Error(`tensorReshape: tensor location ${c.location} is not supported`)}}}),Be,$r=I(()=>{nr(),Si(),Qa(),Xa(),Be=class{constructor(c,g,b){Ti();let T,v;if(typeof c=="object"&&"location"in c)switch(this.dataLocation=c.location,T=c.type,v=c.dims,c.location){case"cpu-pinned":{let k=tt.get(T);if(!k)throw new TypeError(`unsupported type "${T}" to create tensor from pinned buffer`);if(!(c.data instanceof k))throw new TypeError(`buffer should be of type ${k.name}`);this.cpuData=c.data;break}case"texture":{if(T!=="float32")throw new TypeError(`unsupported type "${T}" to create tensor from texture`);this.gpuTextureData=c.texture,this.downloader=c.download,this.disposer=c.dispose;break}case"gpu-buffer":{if(T!=="float32"&&T!=="float16"&&T!=="int32"&&T!=="int64"&&T!=="uint32"&&T!=="uint8"&&T!=="bool"&&T!=="uint4"&&T!=="int4")throw new TypeError(`unsupported type "${T}" to create tensor from gpu buffer`);this.gpuBufferData=c.gpuBuffer,this.downloader=c.download,this.disposer=c.dispose;break}case"ml-tensor":{if(T!=="float32"&&T!=="float16"&&T!=="int32"&&T!=="int64"&&T!=="uint32"&&T!=="uint64"&&T!=="int8"&&T!=="uint8"&&T!=="bool"&&T!=="uint4"&&T!=="int4")throw new TypeError(`unsupported type "${T}" to create tensor from MLTensor`);this.mlTensorData=c.mlTensor,this.downloader=c.download,this.disposer=c.dispose;break}default:throw new Error(`Tensor constructor: unsupported location '${this.dataLocation}'`)}else{let k,E;if(typeof c=="string")if(T=c,E=b,c==="string"){if(!Array.isArray(g))throw new TypeError("A string tensor's data must be a string array.");k=g}else{let O=tt.get(c);if(O===void 0)throw new TypeError(`Unsupported tensor type: ${c}.`);if(Array.isArray(g)){if(c==="float16"&&O===Uint16Array||c==="uint4"||c==="int4")throw new TypeError(`Creating a ${c} tensor from number array is not supported. Please use ${O.name} as data.`);c==="uint64"||c==="int64"?k=O.from(g,BigInt):k=O.from(g)}else if(g instanceof O)k=g;else if(g instanceof Uint8ClampedArray)if(c==="uint8")k=Uint8Array.from(g);else throw new TypeError("A Uint8ClampedArray tensor's data must be type of uint8");else if(c==="float16"&&g instanceof Uint16Array&&O!==Uint16Array)k=new globalThis.Float16Array(g.buffer,g.byteOffset,g.length);else throw new TypeError(`A ${T} tensor's data must be type of ${O}`)}else if(E=g,Array.isArray(c)){if(c.length===0)throw new TypeError("Tensor type cannot be inferred from an empty array.");let O=typeof c[0];if(O==="string")T="string",k=c;else if(O==="boolean")T="bool",k=Uint8Array.from(c);else throw new TypeError(`Invalid element type of data array: ${O}.`)}else if(c instanceof Uint8ClampedArray)T="uint8",k=Uint8Array.from(c);else{let O=Ot.get(c.constructor);if(O===void 0)throw new TypeError(`Unsupported type for tensor data: ${c.constructor}.`);T=O,k=c}if(E===void 0)E=[k.length];else if(!Array.isArray(E))throw new TypeError("A tensor's dims must be a number array");v=E,this.cpuData=k,this.dataLocation="cpu"}let A=Ei(v);if(this.cpuData&&A!==this.cpuData.length&&!((T==="uint4"||T==="int4")&&Math.ceil(A/2)===this.cpuData.length))throw new Error(`Tensor's size(${A}) does not match data length(${this.cpuData.length}).`);this.type=T,this.dims=v,this.size=A}static async fromImage(c,g){return wt(c,g)}static fromTexture(c,g){return wr(c,g)}static fromGpuBuffer(c,g){return _r(c,g)}static fromMLTensor(c,g){return Oe(c,g)}static fromPinnedBuffer(c,g,b){return It(c,g,b)}toDataURL(c){return qe(this,c)}toImageData(c){return ft(this,c)}get data(){if(this.ensureValid(),!this.cpuData)throw new Error("The data is not on CPU. Use `getData()` to download GPU data to CPU, or use `texture` or `gpuBuffer` property to access the GPU data directly.");return this.cpuData}get location(){return this.dataLocation}get texture(){if(this.ensureValid(),!this.gpuTextureData)throw new Error("The data is not stored as a WebGL texture.");return this.gpuTextureData}get gpuBuffer(){if(this.ensureValid(),!this.gpuBufferData)throw new Error("The data is not stored as a WebGPU buffer.");return this.gpuBufferData}get mlTensor(){if(this.ensureValid(),!this.mlTensorData)throw new Error("The data is not stored as a WebNN MLTensor.");return this.mlTensorData}async getData(c){switch(this.ensureValid(),this.dataLocation){case"cpu":case"cpu-pinned":return this.data;case"texture":case"gpu-buffer":case"ml-tensor":{if(!this.downloader)throw new Error("The current tensor is not created with a specified data downloader.");if(this.isDownloading)throw new Error("The current tensor is being downloaded.");try{this.isDownloading=!0;let g=await this.downloader();return this.downloader=void 0,this.dataLocation="cpu",this.cpuData=g,c&&this.disposer&&(this.disposer(),this.disposer=void 0),g}finally{this.isDownloading=!1}}default:throw new Error(`cannot get data from location: ${this.dataLocation}`)}}dispose(){if(this.isDownloading)throw new Error("The current tensor is being downloaded.");this.disposer&&(this.disposer(),this.disposer=void 0),this.cpuData=void 0,this.gpuTextureData=void 0,this.gpuBufferData=void 0,this.mlTensorData=void 0,this.downloader=void 0,this.isDownloading=void 0,this.dataLocation="none"}ensureValid(){if(this.dataLocation==="none")throw new Error("The tensor is disposed.")}reshape(c){if(this.ensureValid(),this.downloader||this.disposer)throw new Error("Cannot reshape a tensor that owns GPU resource.");return ki(this,c)}}}),We,Ii=I(()=>{$r(),We=Be}),Gt,vr,Je,Ze,lt,dt,Ci=I(()=>{Ne(),Gt=(c,g)=>{(typeof ce.trace>"u"?!ce.wasm.trace:!ce.trace)||console.timeStamp(`${c}::ORT::${g}`)},vr=(c,g)=>{var v;let b=((v=new Error().stack)==null?void 0:v.split(/\r\n|\r|\n/g))||[],T=!1;for(let A=0;A<b.length;A++){if(T&&!b[A].includes("TRACE_FUNC")){let k=`FUNC_${c}::${b[A].trim().split(" ")[1]}`;g&&(k+=`::${g}`),Gt("CPU",k);return}b[A].includes("TRACE_FUNC")&&(T=!0)}},Je=c=>{(typeof ce.trace>"u"?!ce.wasm.trace:!ce.trace)||vr("BEGIN",c)},Ze=c=>{(typeof ce.trace>"u"?!ce.wasm.trace:!ce.trace)||vr("END",c)},lt=c=>{(typeof ce.trace>"u"?!ce.wasm.trace:!ce.trace)||console.time(`ORT::${c}`)},dt=c=>{(typeof ce.trace>"u"?!ce.wasm.trace:!ce.trace)||console.timeEnd(`ORT::${c}`)}}),zi,Ya=I(()=>{yt(),Ii(),Ci(),zi=class yc{constructor(g){this.handler=g}async run(g,b,T){Je(),lt("InferenceSession.run");let v={},A={};if(typeof g!="object"||g===null||g instanceof We||Array.isArray(g))throw new TypeError("'feeds' must be an object that use input names as keys and OnnxValue as corresponding values.");let k=!0;if(typeof b=="object"){if(b===null)throw new TypeError("Unexpected argument[1]: cannot be null.");if(b instanceof We)throw new TypeError("'fetches' cannot be a Tensor");if(Array.isArray(b)){if(b.length===0)throw new TypeError("'fetches' cannot be an empty array.");k=!1;for(let L of b){if(typeof L!="string")throw new TypeError("'fetches' must be a string array or an object.");if(this.outputNames.indexOf(L)===-1)throw new RangeError(`'fetches' contains invalid output name: ${L}.`);v[L]=null}if(typeof T=="object"&&T!==null)A=T;else if(typeof T<"u")throw new TypeError("'options' must be an object.")}else{let L=!1,F=Object.getOwnPropertyNames(b);for(let q of this.outputNames)if(F.indexOf(q)!==-1){let P=b[q];(P===null||P instanceof We)&&(L=!0,k=!1,v[q]=P)}if(L){if(typeof T=="object"&&T!==null)A=T;else if(typeof T<"u")throw new TypeError("'options' must be an object.")}else A=b}}else if(typeof b<"u")throw new TypeError("Unexpected argument[1]: must be 'fetches' or 'options'.");for(let L of this.inputNames)if(typeof g[L]>"u")throw new Error(`input '${L}' is missing in 'feeds'.`);if(k)for(let L of this.outputNames)v[L]=null;let E=await this.handler.run(g,v,A),O={};for(let L in E)if(Object.hasOwnProperty.call(E,L)){let F=E[L];F instanceof We?O[L]=F:O[L]=new We(F.type,F.data,F.dims)}return dt("InferenceSession.run"),Ze(),O}async release(){return this.handler.dispose()}static async create(g,b,T,v){Je(),lt("InferenceSession.create");let A,k={};if(typeof g=="string"){if(A=g,typeof b=="object"&&b!==null)k=b;else if(typeof b<"u")throw new TypeError("'options' must be an object.")}else if(g instanceof Uint8Array){if(A=g,typeof b=="object"&&b!==null)k=b;else if(typeof b<"u")throw new TypeError("'options' must be an object.")}else if(g instanceof ArrayBuffer||typeof SharedArrayBuffer<"u"&&g instanceof SharedArrayBuffer){let F=g,q=0,P=g.byteLength;if(typeof b=="object"&&b!==null)k=b;else if(typeof b=="number"){if(q=b,!Number.isSafeInteger(q))throw new RangeError("'byteOffset' must be an integer.");if(q<0||q>=F.byteLength)throw new RangeError(`'byteOffset' is out of range [0, ${F.byteLength}).`);if(P=g.byteLength-q,typeof T=="number"){if(P=T,!Number.isSafeInteger(P))throw new RangeError("'byteLength' must be an integer.");if(P<=0||q+P>F.byteLength)throw new RangeError(`'byteLength' is out of range (0, ${F.byteLength-q}].`);if(typeof v=="object"&&v!==null)k=v;else if(typeof v<"u")throw new TypeError("'options' must be an object.")}else if(typeof T<"u")throw new TypeError("'byteLength' must be a number.")}else if(typeof b<"u")throw new TypeError("'options' must be an object.");A=new Uint8Array(F,q,P)}else throw new TypeError("Unexpected argument[0]: must be 'path' or 'buffer'.");let[E,O]=await Ge(k),L=await E.createInferenceSessionHandler(A,O);return dt("InferenceSession.create"),Ze(),new yc(L)}startProfiling(){this.handler.startProfiling()}endProfiling(){this.handler.endProfiling()}get inputNames(){return this.handler.inputNames}get outputNames(){return this.handler.outputNames}get inputMetadata(){return this.handler.inputMetadata}get outputMetadata(){return this.handler.outputMetadata}}}),xr,Ja=I(()=>{Ya(),xr=zi}),en=I(()=>{}),tn=I(()=>{}),rn=I(()=>{}),an=I(()=>{}),Ai={};ye(Ai,{InferenceSession:()=>xr,TRACE:()=>Gt,TRACE_EVENT_BEGIN:()=>lt,TRACE_EVENT_END:()=>dt,TRACE_FUNC_BEGIN:()=>Je,TRACE_FUNC_END:()=>Ze,Tensor:()=>We,env:()=>te,registerBackend:()=>we});var Qe=I(()=>{At(),ot(),Ja(),Ii(),en(),tn(),Ci(),rn(),an()}),Sr=I(()=>{}),Oi={};ye(Oi,{default:()=>Ri});var Tr,Er,Ri,nn=I(()=>{var c;Yi(),_t(),Ar(),Tr="ort-wasm-proxy-worker",Er=((c=globalThis.self)==null?void 0:c.name)===Tr,Er&&(self.onmessage=g=>{let{type:b,in:T}=g.data;try{switch(b){case"init-wasm":Br(T.wasm).then(()=>{ai(T).then(()=>{postMessage({type:b})},v=>{postMessage({type:b,err:v})})},v=>{postMessage({type:b,err:v})});break;case"init-ep":{let{epName:v,env:A}=T;ni(A,v).then(()=>{postMessage({type:b})},k=>{postMessage({type:b,err:k})});break}case"copy-from":{let{buffer:v}=T,A=Te(v);postMessage({type:b,out:A});break}case"create":{let{model:v,options:A}=T;Tt(v,A).then(k=>{postMessage({type:b,out:k})},k=>{postMessage({type:b,err:k})});break}case"release":ui(T),postMessage({type:b});break;case"run":{let{sessionId:v,inputIndices:A,inputs:k,outputIndices:E,options:O}=T;U(v,A,k,E,new Array(E.length).fill(null),O).then(L=>{L.some(F=>F[3]!=="cpu")?postMessage({type:b,err:"Proxy does not support non-cpu tensor location."}):postMessage({type:b,out:L},li([...k,...L]))},L=>{postMessage({type:b,err:L})});break}case"end-profiling":sr(T),postMessage({type:b});break;default:}}catch(v){postMessage({type:b,err:v})}}),Ri=Er?null:g=>new Worker(g??Me,{type:"classic",name:Tr})}),Bi,Mi,Me,kr,Jt,Di,Pi,Ir,Ui,Cr,Ni,zr,Li,Ar=I(()=>{Sr(),Bi=typeof location>"u"?void 0:location.origin,Mi=()=>{var c,g;return typeof document<"u"?(c=document.currentScript)==null?void 0:c.src:typeof self<"u"?(g=self.location)==null?void 0:g.href:void 0},Me=Mi(),kr=()=>{if(Me&&!Me.startsWith("blob:"))return Me.substring(0,Me.lastIndexOf("/")+1)},Jt=(c,g)=>{try{let b=g??Me;return(b?new URL(c,b):new URL(c)).origin===Bi}catch{return!1}},Di=(c,g)=>{let b=g??Me;try{return(b?new URL(c,b):new URL(c)).href}catch{return}},Pi=(c,g)=>`${g??"./"}${c}`,Ir=async c=>{let g=await(await fetch(c,{credentials:"same-origin"})).blob();return URL.createObjectURL(g)},Ui=async c=>(await import(c)).default,Cr=(nn(),Le(Oi)).default,Ni=async()=>{if(!Me)throw new Error("Failed to load proxy worker: cannot determine the script source URL.");if(Jt(Me))return[void 0,Cr()];let c=await Ir(Me);return[c,Cr(c)]},zr=void 0,Li=async(c,g,b,T)=>{let v=zr&&!(c||g);if(v)if(Me)v=Jt(Me);else if(T&&!b)v=!0;else throw new Error("cannot determine the script source URL.");if(v)return[void 0,zr];{let A="ort-wasm-simd-threaded.mjs",k=c??Di(A,g),E=b&&k&&!Jt(k,g),O=E?await Ir(k):k??Pi(A,g);return[E?O:void 0,await Ui(O)]}}}),Or,er,Rt,Rr,Vi,Wi,Fi,Br,he,_t=I(()=>{Ar(),er=!1,Rt=!1,Rr=!1,Vi=()=>{if(typeof SharedArrayBuffer>"u")return!1;try{return typeof MessageChannel<"u"&&new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)),WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,5,4,1,3,1,1,10,11,1,9,0,65,0,254,16,2,0,26,11]))}catch{return!1}},Wi=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,10,30,1,28,0,65,0,253,15,253,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,253,186,1,26,11]))}catch{return!1}},Fi=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,19,1,17,0,65,1,253,15,65,2,253,15,65,3,253,15,253,147,2,11]))}catch{return!1}},Br=async c=>{if(er)return Promise.resolve();if(Rt)throw new Error("multiple calls to 'initializeWebAssembly()' detected.");if(Rr)throw new Error("previous call to 'initializeWebAssembly()' failed.");Rt=!0;let g=c.initTimeout,b=c.numThreads;if(c.simd!==!1){if(c.simd==="relaxed"){if(!Fi())throw new Error("Relaxed WebAssembly SIMD is not supported in the current environment.")}else if(!Wi())throw new Error("WebAssembly SIMD is not supported in the current environment.")}let T=Vi();b>1&&!T&&(typeof self<"u"&&!self.crossOriginIsolated&&console.warn("env.wasm.numThreads is set to "+b+", but this will not work unless you enable crossOriginIsolated mode. See https://web.dev/cross-origin-isolation-guide/ for more info."),console.warn("WebAssembly multi-threading is not supported in the current environment. Falling back to single-threading."),c.numThreads=b=1);let v=c.wasmPaths,A=typeof v=="string"?v:void 0,k=v==null?void 0:v.mjs,E=(k==null?void 0:k.href)??k,O=v==null?void 0:v.wasm,L=(O==null?void 0:O.href)??O,F=c.wasmBinary,[q,P]=await Li(E,A,b>1,!!F||!!L),J=!1,z=[];if(g>0&&z.push(new Promise(H=>{setTimeout(()=>{J=!0,H()},g)})),z.push(new Promise((H,Ue)=>{let _e={numThreads:b};if(F)_e.wasmBinary=F;else if(L||A)_e.locateFile=ge=>L??A+ge;else if(E&&E.indexOf("blob:")!==0)_e.locateFile=ge=>new URL(ge,E).href;else if(q){let ge=kr();ge&&(_e.locateFile=Re=>ge+Re)}P(_e).then(ge=>{Rt=!1,er=!0,Or=ge,H(),q&&URL.revokeObjectURL(q)},ge=>{Rt=!1,Rr=!0,Ue(ge)})})),await Promise.race(z),J)throw new Error(`WebAssembly backend initializing failed due to timeout: ${g}ms`)},he=()=>{if(er&&Or)return Or;throw new Error("WebAssembly is not initialized yet.")}}),Fe,tr,le,Mr=I(()=>{_t(),Fe=(c,g)=>{let b=he(),T=b.lengthBytesUTF8(c)+1,v=b._malloc(T);return b.stringToUTF8(c,v,T),g.push(v),v},tr=(c,g,b,T)=>{if(typeof c=="object"&&c!==null){if(b.has(c))throw new Error("Circular reference in options");b.add(c)}Object.entries(c).forEach(([v,A])=>{let k=g?g+v:v;if(typeof A=="object")tr(A,k+".",b,T);else if(typeof A=="string"||typeof A=="number")T(k,A.toString());else if(typeof A=="boolean")T(k,A?"1":"0");else throw new Error(`Can't handle extra config type: ${typeof A}`)})},le=c=>{let g=he(),b=g.stackSave();try{let T=g.PTR_SIZE,v=g.stackAlloc(2*T);g._OrtGetLastError(v,v+T);let A=Number(g.getValue(v,T===4?"i32":"i64")),k=g.getValue(v+T,"*"),E=k?g.UTF8ToString(k):"";throw new Error(`${c} ERROR_CODE: ${A}, ERROR_MESSAGE: ${E}`)}finally{g.stackRestore(b)}}}),qi,sn=I(()=>{_t(),Mr(),qi=c=>{let g=he(),b=0,T=[],v=c||{};try{if((c==null?void 0:c.logSeverityLevel)===void 0)v.logSeverityLevel=2;else if(typeof c.logSeverityLevel!="number"||!Number.isInteger(c.logSeverityLevel)||c.logSeverityLevel<0||c.logSeverityLevel>4)throw new Error(`log severity level is not valid: ${c.logSeverityLevel}`);if((c==null?void 0:c.logVerbosityLevel)===void 0)v.logVerbosityLevel=0;else if(typeof c.logVerbosityLevel!="number"||!Number.isInteger(c.logVerbosityLevel))throw new Error(`log verbosity level is not valid: ${c.logVerbosityLevel}`);(c==null?void 0:c.terminate)===void 0&&(v.terminate=!1);let A=0;return(c==null?void 0:c.tag)!==void 0&&(A=Fe(c.tag,T)),b=g._OrtCreateRunOptions(v.logSeverityLevel,v.logVerbosityLevel,!!v.terminate,A),b===0&&le("Can't create run options."),(c==null?void 0:c.extra)!==void 0&&tr(c.extra,"",new WeakSet,(k,E)=>{let O=Fe(k,T),L=Fe(E,T);g._OrtAddRunConfigEntry(b,O,L)!==0&&le(`Can't set a run config entry: ${k} - ${E}.`)}),[b,T]}catch(A){throw b!==0&&g._OrtReleaseRunOptions(b),T.forEach(k=>g._free(k)),A}}}),Gi,ji,Hi,Bt,Ki,Zi,on=I(()=>{_t(),Mr(),Gi=c=>{switch(c){case"disabled":return 0;case"basic":return 1;case"extended":return 2;case"layout":return 3;case"all":return 99;default:throw new Error(`unsupported graph optimization level: ${c}`)}},ji=c=>{switch(c){case"sequential":return 0;case"parallel":return 1;default:throw new Error(`unsupported execution mode: ${c}`)}},Hi=c=>{c.extra||(c.extra={}),c.extra.session||(c.extra.session={});let g=c.extra.session;g.use_ort_model_bytes_directly||(g.use_ort_model_bytes_directly="1"),c.executionProviders&&c.executionProviders.some(b=>(typeof b=="string"?b:b.name)==="webgpu")&&(c.enableMemPattern=!1)},Bt=(c,g,b,T)=>{let v=Fe(g,T),A=Fe(b,T);he()._OrtAddSessionConfigEntry(c,v,A)!==0&&le(`Can't set a session config entry: ${g} - ${b}.`)},Ki=async(c,g,b)=>{for(let T of g){let v=typeof T=="string"?T:T.name,A=[];switch(v){case"webnn":if(v="WEBNN",typeof T!="string"){let F=T==null?void 0:T.deviceType;F&&Bt(c,"deviceType",F,b)}break;case"webgpu":if(v="JS",typeof T!="string"){let F=T;if(F!=null&&F.preferredLayout){if(F.preferredLayout!=="NCHW"&&F.preferredLayout!=="NHWC")throw new Error(`preferredLayout must be either 'NCHW' or 'NHWC': ${F.preferredLayout}`);Bt(c,"preferredLayout",F.preferredLayout,b)}}break;case"wasm":case"cpu":continue;default:throw new Error(`not supported execution provider: ${v}`)}let k=Fe(v,b),E=A.length,O=0,L=0;if(E>0){O=he()._malloc(E*he().PTR_SIZE),b.push(O),L=he()._malloc(E*he().PTR_SIZE),b.push(L);for(let F=0;F<E;F++)he().setValue(O+F*he().PTR_SIZE,A[F][0],"*"),he().setValue(L+F*he().PTR_SIZE,A[F][1],"*")}await he()._OrtAppendExecutionProvider(c,k,O,L,E)!==0&&le(`Can't append execution provider: ${v}.`)}},Zi=async c=>{let g=he(),b=0,T=[],v=c||{};Hi(v);try{let A=Gi(v.graphOptimizationLevel??"all"),k=ji(v.executionMode??"sequential"),E=typeof v.logId=="string"?Fe(v.logId,T):0,O=v.logSeverityLevel??2;if(!Number.isInteger(O)||O<0||O>4)throw new Error(`log severity level is not valid: ${O}`);let L=v.logVerbosityLevel??0;if(!Number.isInteger(L)||L<0||L>4)throw new Error(`log verbosity level is not valid: ${L}`);let F=typeof v.optimizedModelFilePath=="string"?Fe(v.optimizedModelFilePath,T):0;if(b=g._OrtCreateSessionOptions(A,!!v.enableCpuMemArena,!!v.enableMemPattern,k,!!v.enableProfiling,0,E,O,L,F),b===0&&le("Can't create session options."),v.executionProviders&&await Ki(b,v.executionProviders,T),v.enableGraphCapture!==void 0){if(typeof v.enableGraphCapture!="boolean")throw new Error(`enableGraphCapture must be a boolean value: ${v.enableGraphCapture}`);Bt(b,"enableGraphCapture",v.enableGraphCapture.toString(),T)}if(v.freeDimensionOverrides)for(let[q,P]of Object.entries(v.freeDimensionOverrides)){if(typeof q!="string")throw new Error(`free dimension override name must be a string: ${q}`);if(typeof P!="number"||!Number.isInteger(P)||P<0)throw new Error(`free dimension override value must be a non-negative integer: ${P}`);let J=Fe(q,T);g._OrtAddFreeDimensionOverride(b,J,P)!==0&&le(`Can't set a free dimension override: ${q} - ${P}.`)}return v.extra!==void 0&&tr(v.extra,"",new WeakSet,(q,P)=>{Bt(b,q,P,T)}),[b,T]}catch(A){throw b!==0&&g._OrtReleaseSessionOptions(b)!==0&&le("Can't release session options."),T.forEach(k=>g._free(k)),A}}}),bt,$t,vt,Dr,Pr,Ur,Nr,ii,pe=I(()=>{bt=c=>{switch(c){case"int8":return 3;case"uint8":return 2;case"bool":return 9;case"int16":return 5;case"uint16":return 4;case"int32":return 6;case"uint32":return 12;case"float16":return 10;case"float32":return 1;case"float64":return 11;case"string":return 8;case"int64":return 7;case"uint64":return 13;case"int4":return 22;case"uint4":return 21;default:throw new Error(`unsupported data type: ${c}`)}},$t=c=>{switch(c){case 3:return"int8";case 2:return"uint8";case 9:return"bool";case 5:return"int16";case 4:return"uint16";case 6:return"int32";case 12:return"uint32";case 10:return"float16";case 1:return"float32";case 11:return"float64";case 8:return"string";case 7:return"int64";case 13:return"uint64";case 22:return"int4";case 21:return"uint4";default:throw new Error(`unsupported data type: ${c}`)}},vt=(c,g)=>{let b=[-1,4,1,1,2,2,4,8,-1,1,2,8,4,8,-1,-1,-1,-1,-1,-1,-1,.5,.5][c],T=typeof g=="number"?g:g.reduce((v,A)=>v*A,1);return b>0?Math.ceil(T*b):void 0},Dr=c=>{switch(c){case"float16":return typeof Float16Array<"u"&&Float16Array.from?Float16Array:Uint16Array;case"float32":return Float32Array;case"uint8":return Uint8Array;case"int8":return Int8Array;case"uint16":return Uint16Array;case"int16":return Int16Array;case"int32":return Int32Array;case"bool":return Uint8Array;case"float64":return Float64Array;case"uint32":return Uint32Array;case"int64":return BigInt64Array;case"uint64":return BigUint64Array;default:throw new Error(`unsupported type: ${c}`)}},Pr=c=>{switch(c){case"verbose":return 0;case"info":return 1;case"warning":return 2;case"error":return 3;case"fatal":return 4;default:throw new Error(`unsupported logging level: ${c}`)}},Ur=c=>c==="float32"||c==="float16"||c==="int32"||c==="int64"||c==="uint32"||c==="uint8"||c==="bool"||c==="uint4"||c==="int4",Nr=c=>c==="float32"||c==="float16"||c==="int32"||c==="int64"||c==="uint32"||c==="uint64"||c==="int8"||c==="uint8"||c==="bool"||c==="uint4"||c==="int4",ii=c=>{switch(c){case"none":return 0;case"cpu":return 1;case"cpu-pinned":return 2;case"texture":return 3;case"gpu-buffer":return 4;case"ml-tensor":return 5;default:throw new Error(`unsupported data location: ${c}`)}}}),Lr,Qi=I(()=>{Sr(),Lr=async c=>{if(typeof c=="string"){let g=await fetch(c);if(!g.ok)throw new Error(`failed to load external data file: ${c}`);let b=g.headers.get("Content-Length"),T=b?parseInt(b,10):0;if(T<1073741824)return new Uint8Array(await g.arrayBuffer());{if(!g.body)throw new Error(`failed to load external data file: ${c}, no response body.`);let v=g.body.getReader(),A;try{A=new ArrayBuffer(T)}catch(E){if(E instanceof RangeError){let O=Math.ceil(T/65536);A=new WebAssembly.Memory({initial:O,maximum:O}).buffer}else throw E}let k=0;for(;;){let{done:E,value:O}=await v.read();if(E)break;let L=O.byteLength;new Uint8Array(A,k,L).set(O),k+=L}return new Uint8Array(A,0,T)}}else return c instanceof Blob?new Uint8Array(await c.arrayBuffer()):c instanceof Uint8Array?c:new Uint8Array(c)}}),Xi,ai,ni,jt,si,oi,Te,Tt,ui,Ht,U,sr,li,Yi=I(()=>{Qe(),sn(),on(),pe(),_t(),Mr(),Qi(),Xi=(c,g)=>{he()._OrtInit(c,g)!==0&&le("Can't initialize onnxruntime.")},ai=async c=>{Xi(c.wasm.numThreads,Pr(c.logLevel))},ni=async(c,g)=>{var T,v;(v=(T=he()).asyncInit)==null||v.call(T);let b=c.webgpu.adapter;if(g==="webgpu"){if(typeof navigator>"u"||!navigator.gpu)throw new Error("WebGPU is not supported in current environment");if(b){if(typeof b.limits!="object"||typeof b.features!="object"||typeof b.requestDevice!="function")throw new Error("Invalid GPU adapter set in `env.webgpu.adapter`. It must be a GPUAdapter object.")}else{let A=c.webgpu.powerPreference;if(A!==void 0&&A!=="low-power"&&A!=="high-performance")throw new Error(`Invalid powerPreference setting: "${A}"`);let k=c.webgpu.forceFallbackAdapter;if(k!==void 0&&typeof k!="boolean")throw new Error(`Invalid forceFallbackAdapter setting: "${k}"`);if(b=await navigator.gpu.requestAdapter({powerPreference:A,forceFallbackAdapter:k}),!b)throw new Error('Failed to get GPU adapter. You may need to enable flag "--enable-unsafe-webgpu" if you are using Chrome.')}}if(g==="webnn"&&(typeof navigator>"u"||!navigator.ml))throw new Error("WebNN is not supported in current environment")},jt=new Map,si=c=>{let g=he(),b=g.stackSave();try{let T=g.PTR_SIZE,v=g.stackAlloc(2*T);g._OrtGetInputOutputCount(c,v,v+T)!==0&&le("Can't get session input/output count.");let A=T===4?"i32":"i64";return[Number(g.getValue(v,A)),Number(g.getValue(v+T,A))]}finally{g.stackRestore(b)}},oi=(c,g)=>{let b=he(),T=b.stackSave(),v=0;try{let A=b.PTR_SIZE,k=b.stackAlloc(2*A);b._OrtGetInputOutputMetadata(c,g,k,k+A)!==0&&le("Can't get session input/output metadata.");let E=Number(b.getValue(k,"*"));v=Number(b.getValue(k+A,"*"));let O=b.HEAP32[v/4];if(O===0)return[E,0];let L=b.HEAPU32[v/4+1],F=[];for(let q=0;q<L;q++){let P=Number(b.getValue(v+8+q*A,"*"));F.push(P!==0?b.UTF8ToString(P):Number(b.getValue(v+8+(q+L)*A,"*")))}return[E,O,F]}finally{b.stackRestore(T),v!==0&&b._OrtFree(v)}},Te=c=>{let g=he(),b=g._malloc(c.byteLength);if(b===0)throw new Error(`Can't create a session. failed to allocate a buffer of size ${c.byteLength}.`);return g.HEAPU8.set(c,b),[b,c.byteLength]},Tt=async(c,g)=>{var F,q,P;let b,T,v=he();Array.isArray(c)?[b,T]=c:c.buffer===v.HEAPU8.buffer?[b,T]=[c.byteOffset,c.byteLength]:[b,T]=Te(c);let A=0,k=0,E=[],O=[],L=[];try{if([k,E]=await Zi(g),(g==null?void 0:g.externalData)&&v.mountExternalData){let De=[];for(let Ce of g.externalData){let et=typeof Ce=="string"?Ce:Ce.path;De.push(Lr(typeof Ce=="string"?Ce:Ce.data).then(rt=>{v.mountExternalData(et,rt)}))}await Promise.all(De)}for(let De of(g==null?void 0:g.executionProviders)??[])if((typeof De=="string"?De:De.name)==="webnn"){if(v.shouldTransferToMLTensor=!1,typeof De!="string"){let Ce=De,et=Ce==null?void 0:Ce.context,rt=Ce==null?void 0:Ce.gpuDevice,mt=Ce==null?void 0:Ce.deviceType,qr=Ce==null?void 0:Ce.powerPreference;et?v.currentContext=et:rt?v.currentContext=await v.webnnCreateMLContext(rt):v.currentContext=await v.webnnCreateMLContext({deviceType:mt,powerPreference:qr})}else v.currentContext=await v.webnnCreateMLContext();break}A=await v._OrtCreateSession(b,T,k),(F=v.webgpuOnCreateSession)==null||F.call(v,A),A===0&&le("Can't create a session."),(q=v.jsepOnCreateSession)==null||q.call(v),v.currentContext&&(v.webnnRegisterMLContext(A,v.currentContext),v.currentContext=void 0,v.shouldTransferToMLTensor=!0);let[J,z]=si(A),H=!!(g!=null&&g.enableGraphCapture),Ue=[],_e=[],ge=[],Re=[],re=[];for(let De=0;De<J;De++){let[Ce,et,rt]=oi(A,De);Ce===0&&le("Can't get an input name."),O.push(Ce);let mt=v.UTF8ToString(Ce);Ue.push(mt),ge.push(et===0?{name:mt,isTensor:!1}:{name:mt,isTensor:!0,type:$t(et),shape:rt})}for(let De=0;De<z;De++){let[Ce,et,rt]=oi(A,De+J);Ce===0&&le("Can't get an output name."),L.push(Ce);let mt=v.UTF8ToString(Ce);_e.push(mt),Re.push(et===0?{name:mt,isTensor:!1}:{name:mt,isTensor:!0,type:$t(et),shape:rt})}return jt.set(A,[A,O,L,null,H,!1]),[A,Ue,_e,ge,Re]}catch(J){throw O.forEach(z=>v._OrtFree(z)),L.forEach(z=>v._OrtFree(z)),A!==0&&v._OrtReleaseSession(A)!==0&&le("Can't release session."),J}finally{v._free(b),k!==0&&v._OrtReleaseSessionOptions(k)!==0&&le("Can't release session options."),E.forEach(J=>v._free(J)),(P=v.unmountExternalData)==null||P.call(v)}},ui=c=>{var O,L,F;let g=he(),b=jt.get(c);if(!b)throw new Error(`cannot release session. invalid session id: ${c}`);let[T,v,A,k,E]=b;k&&(E&&g._OrtClearBoundOutputs(k.handle)!==0&&le("Can't clear bound outputs."),g._OrtReleaseBinding(k.handle)!==0&&le("Can't release IO binding.")),(O=g.jsepOnReleaseSession)==null||O.call(g,c),(L=g.webnnOnReleaseSession)==null||L.call(g,c),(F=g.webgpuOnReleaseSession)==null||F.call(g,c),v.forEach(q=>g._OrtFree(q)),A.forEach(q=>g._OrtFree(q)),g._OrtReleaseSession(T)!==0&&le("Can't release session."),jt.delete(c)},Ht=async(c,g,b,T,v,A,k=!1)=>{if(!c){g.push(0);return}let E=he(),O=E.PTR_SIZE,L=c[0],F=c[1],q=c[3],P=q,J,z;if(L==="string"&&(q==="gpu-buffer"||q==="ml-tensor"))throw new Error("String tensor is not supported on GPU.");if(k&&q!=="gpu-buffer")throw new Error(`External buffer must be provided for input/output index ${A} when enableGraphCapture is true.`);if(q==="gpu-buffer"){let _e=c[2].gpuBuffer;z=vt(bt(L),F);{let ge=E.jsepRegisterBuffer;if(!ge)throw new Error('Tensor location "gpu-buffer" is not supported without using WebGPU.');J=ge(T,A,_e,z)}}else if(q==="ml-tensor"){let _e=c[2].mlTensor;z=vt(bt(L),F);let ge=E.webnnRegisterMLTensor;if(!ge)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');J=ge(T,_e,bt(L),F)}else{let _e=c[2];if(Array.isArray(_e)){z=O*_e.length,J=E._malloc(z),b.push(J);for(let ge=0;ge<_e.length;ge++){if(typeof _e[ge]!="string")throw new TypeError(`tensor data at index ${ge} is not a string`);E.setValue(J+ge*O,Fe(_e[ge],b),"*")}}else{let ge=E.webnnIsGraphInput,Re=E.webnnIsGraphOutput;if(L!=="string"&&ge&&Re){let re=E.UTF8ToString(v);if(ge(T,re)||Re(T,re)){let De=bt(L);z=vt(De,F),P="ml-tensor";let Ce=E.webnnCreateTemporaryTensor,et=E.webnnUploadTensor;if(!Ce||!et)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');let rt=await Ce(T,De,F);et(rt,new Uint8Array(_e.buffer,_e.byteOffset,_e.byteLength)),J=rt}else z=_e.byteLength,J=E._malloc(z),b.push(J),E.HEAPU8.set(new Uint8Array(_e.buffer,_e.byteOffset,z),J)}else z=_e.byteLength,J=E._malloc(z),b.push(J),E.HEAPU8.set(new Uint8Array(_e.buffer,_e.byteOffset,z),J)}}let H=E.stackSave(),Ue=E.stackAlloc(4*F.length);try{F.forEach((ge,Re)=>E.setValue(Ue+Re*O,ge,O===4?"i32":"i64"));let _e=E._OrtCreateTensor(bt(L),J,z,Ue,F.length,ii(P));_e===0&&le(`Can't create tensor for input/output. session=${T}, index=${A}.`),g.push(_e)}finally{E.stackRestore(H)}},U=async(c,g,b,T,v,A)=>{var qr,pt,sa;let k=he(),E=k.PTR_SIZE,O=jt.get(c);if(!O)throw new Error(`cannot run inference. invalid session id: ${c}`);let L=O[0],F=O[1],q=O[2],P=O[3],J=O[4];O[5];let z=g.length,H=T.length,Ue=0,_e=[],ge=[],Re=[],re=[],De=k.stackSave(),Ce=k.stackAlloc(z*E),et=k.stackAlloc(z*E),rt=k.stackAlloc(H*E),mt=k.stackAlloc(H*E);try{[Ue,_e]=qi(A),lt("wasm prepareInputOutputTensor");for(let Ee=0;Ee<z;Ee++)await Ht(b[Ee],ge,re,c,F[g[Ee]],g[Ee],J);for(let Ee=0;Ee<H;Ee++)await Ht(v[Ee],Re,re,c,q[T[Ee]],z+T[Ee],J);dt("wasm prepareInputOutputTensor");for(let Ee=0;Ee<z;Ee++)k.setValue(Ce+Ee*E,ge[Ee],"*"),k.setValue(et+Ee*E,F[g[Ee]],"*");for(let Ee=0;Ee<H;Ee++)k.setValue(rt+Ee*E,Re[Ee],"*"),k.setValue(mt+Ee*E,q[T[Ee]],"*");(qr=k.jsepOnRunStart)==null||qr.call(k,L),(pt=k.webnnOnRunStart)==null||pt.call(k,L);let Et;Et=await k._OrtRun(L,et,Ce,z,mt,H,rt,Ue),Et!==0&&le("failed to call OrtRun().");let it=[],oa=[];lt("wasm ProcessOutputTensor");for(let Ee=0;Ee<H;Ee++){let Pt=Number(k.getValue(rt+Ee*E,"*"));if(Pt===Re[Ee]){it.push(v[Ee]);continue}let ka=k.stackSave(),Ut=k.stackAlloc(4*E),Gr=!1,je,ct=0;try{k._OrtGetTensorData(Pt,Ut,Ut+E,Ut+2*E,Ut+3*E)!==0&&le(`Can't access output tensor data on index ${Ee}.`);let _i=E===4?"i32":"i64",jr=Number(k.getValue(Ut,_i));ct=k.getValue(Ut+E,"*");let xt=k.getValue(Ut+E*2,"*"),Ia=Number(k.getValue(Ut+E*3,_i)),Nt=[];for(let He=0;He<Ia;He++)Nt.push(Number(k.getValue(xt+He*E,_i)));k._OrtFree(xt)!==0&&le("Can't free memory for tensor dims.");let Lt=Nt.reduce((He,Ve)=>He*Ve,1);je=$t(jr);let dr=P==null?void 0:P.outputPreferredLocations[T[Ee]];if(je==="string"){if(dr==="gpu-buffer"||dr==="ml-tensor")throw new Error("String tensor is not supported on GPU.");let He=[];for(let Ve=0;Ve<Lt;Ve++){let Ct=k.getValue(ct+Ve*E,"*"),Ca=k.getValue(ct+(Ve+1)*E,"*"),za=Ve===Lt-1?void 0:Ca-Ct;He.push(k.UTF8ToString(Ct,za))}it.push([je,Nt,He,"cpu"])}else if(dr==="gpu-buffer"&&Lt>0){let He=k.jsepGetBuffer;if(!He)throw new Error('preferredLocation "gpu-buffer" is not supported without using WebGPU.');let Ve=He(ct),Ct=vt(jr,Lt);if(Ct===void 0||!Ur(je))throw new Error(`Unsupported data type: ${je}`);Gr=!0,it.push([je,Nt,{gpuBuffer:Ve,download:k.jsepCreateDownloader(Ve,Ct,je),dispose:()=>{k._OrtReleaseTensor(Pt)!==0&&le("Can't release tensor.")}},"gpu-buffer"])}else if(dr==="ml-tensor"&&Lt>0){let He=k.webnnEnsureTensor,Ve=k.webnnIsGraphInputOutputTypeSupported;if(!He||!Ve)throw new Error('preferredLocation "ml-tensor" is not supported without using WebNN.');if(vt(jr,Lt)===void 0||!Nr(je))throw new Error(`Unsupported data type: ${je}`);if(!Ve(c,je,!1))throw new Error(`preferredLocation "ml-tensor" for ${je} output is not supported by current WebNN Context.`);let Ct=await He(c,ct,jr,Nt,!1);Gr=!0,it.push([je,Nt,{mlTensor:Ct,download:k.webnnCreateMLTensorDownloader(ct,je),dispose:()=>{k.webnnReleaseTensorId(ct),k._OrtReleaseTensor(Pt)}},"ml-tensor"])}else if(dr==="ml-tensor-cpu-output"&&Lt>0){let He=k.webnnCreateMLTensorDownloader(ct,je)(),Ve=it.length;Gr=!0,oa.push((async()=>{let Ct=[Ve,await He];return k.webnnReleaseTensorId(ct),k._OrtReleaseTensor(Pt),Ct})()),it.push([je,Nt,[],"cpu"])}else{let He=Dr(je),Ve=new He(Lt);new Uint8Array(Ve.buffer,Ve.byteOffset,Ve.byteLength).set(k.HEAPU8.subarray(ct,ct+Ve.byteLength)),it.push([je,Nt,Ve,"cpu"])}}finally{k.stackRestore(ka),je==="string"&&ct&&k._free(ct),Gr||k._OrtReleaseTensor(Pt)}}P&&!J&&(k._OrtClearBoundOutputs(P.handle)!==0&&le("Can't clear bound outputs."),jt.set(c,[L,F,q,P,J,!1]));for(let[Ee,Pt]of await Promise.all(oa))it[Ee][2]=Pt;return dt("wasm ProcessOutputTensor"),it}finally{(sa=k.webnnOnRunEnd)==null||sa.call(k,L),k.stackRestore(De),ge.forEach(Et=>k._OrtReleaseTensor(Et)),Re.forEach(Et=>k._OrtReleaseTensor(Et)),re.forEach(Et=>k._free(Et)),Ue!==0&&k._OrtReleaseRunOptions(Ue),_e.forEach(Et=>k._free(Et))}},sr=c=>{let g=he(),b=jt.get(c);if(!b)throw new Error("invalid session id");let T=b[0],v=g._OrtEndProfiling(T);v===0&&le("Can't get an profile file name."),g._OrtFree(v)},li=c=>{let g=[];for(let b of c){let T=b[2];!Array.isArray(T)&&"buffer"in T&&g.push(T.buffer)}return g}}),Mt,ae,Kt,or,rr,ur,Vr,Wr,Dt,Zt,di,pi,ci,Ji,ea,Ta,lr,ta,ra=I(()=>{Qe(),Yi(),_t(),Ar(),Mt=()=>!!te.wasm.proxy&&typeof document<"u",Kt=!1,or=!1,rr=!1,Wr=new Map,Dt=(c,g)=>{let b=Wr.get(c);b?b.push(g):Wr.set(c,[g])},Zt=()=>{if(Kt||!or||rr||!ae)throw new Error("worker not ready")},di=c=>{switch(c.data.type){case"init-wasm":Kt=!1,c.data.err?(rr=!0,Vr[1](c.data.err)):(or=!0,Vr[0]()),ur&&(URL.revokeObjectURL(ur),ur=void 0);break;case"init-ep":case"copy-from":case"create":case"release":case"run":case"end-profiling":{let g=Wr.get(c.data.type);c.data.err?g.shift()[1](c.data.err):g.shift()[0](c.data.out);break}}},pi=async()=>{if(!or){if(Kt)throw new Error("multiple calls to 'initWasm()' detected.");if(rr)throw new Error("previous call to 'initWasm()' failed.");if(Kt=!0,Mt())return new Promise((c,g)=>{ae==null||ae.terminate(),Ni().then(([b,T])=>{try{ae=T,ae.onerror=A=>g(A),ae.onmessage=di,Vr=[c,g];let v={type:"init-wasm",in:te};if(!v.in.wasm.wasmPaths&&b){let A=kr();A&&(v.in.wasm.wasmPaths=A)}ae.postMessage(v),ur=b}catch(v){g(v)}},g)});try{await Br(te.wasm),await ai(te),or=!0}catch(c){throw rr=!0,c}finally{Kt=!1}}},ci=async c=>{if(Mt())return Zt(),new Promise((g,b)=>{Dt("init-ep",[g,b]);let T={type:"init-ep",in:{epName:c,env:te}};ae.postMessage(T)});await ni(te,c)},Ji=async c=>Mt()?(Zt(),new Promise((g,b)=>{Dt("copy-from",[g,b]);let T={type:"copy-from",in:{buffer:c}};ae.postMessage(T,[c.buffer])})):Te(c),ea=async(c,g)=>{if(Mt()){if(g!=null&&g.preferredOutputLocation)throw new Error('session option "preferredOutputLocation" is not supported for proxy.');return Zt(),new Promise((b,T)=>{Dt("create",[b,T]);let v={type:"create",in:{model:c,options:{...g}}},A=[];c instanceof Uint8Array&&A.push(c.buffer),ae.postMessage(v,A)})}else return Tt(c,g)},Ta=async c=>{if(Mt())return Zt(),new Promise((g,b)=>{Dt("release",[g,b]);let T={type:"release",in:c};ae.postMessage(T)});ui(c)},lr=async(c,g,b,T,v,A)=>{if(Mt()){if(b.some(k=>k[3]!=="cpu"))throw new Error("input tensor on GPU is not supported for proxy.");if(v.some(k=>k))throw new Error("pre-allocated output tensor is not supported for proxy.");return Zt(),new Promise((k,E)=>{Dt("run",[k,E]);let O=b,L={type:"run",in:{sessionId:c,inputIndices:g,inputs:O,outputIndices:T,options:A}};ae.postMessage(L,li(O))})}else return U(c,g,b,T,v,A)},ta=async c=>{if(Mt())return Zt(),new Promise((g,b)=>{Dt("end-profiling",[g,b]);let T={type:"end-profiling",in:c};ae.postMessage(T)});sr(c)}}),ia,hi,fi,mi=I(()=>{Qe(),ra(),pe(),Sr(),Qi(),ia=(c,g)=>{switch(c.location){case"cpu":return[c.type,c.dims,c.data,"cpu"];case"gpu-buffer":return[c.type,c.dims,{gpuBuffer:c.gpuBuffer},"gpu-buffer"];case"ml-tensor":return[c.type,c.dims,{mlTensor:c.mlTensor},"ml-tensor"];default:throw new Error(`invalid data location: ${c.location} for ${g()}`)}},hi=c=>{switch(c[3]){case"cpu":return new We(c[0],c[2],c[1]);case"gpu-buffer":{let g=c[0];if(!Ur(g))throw new Error(`not supported data type: ${g} for deserializing GPU tensor`);let{gpuBuffer:b,download:T,dispose:v}=c[2];return We.fromGpuBuffer(b,{dataType:g,dims:c[1],download:T,dispose:v})}case"ml-tensor":{let g=c[0];if(!Nr(g))throw new Error(`not supported data type: ${g} for deserializing MLTensor tensor`);let{mlTensor:b,download:T,dispose:v}=c[2];return We.fromMLTensor(b,{dataType:g,dims:c[1],download:T,dispose:v})}default:throw new Error(`invalid data location: ${c[3]}`)}},fi=class{async fetchModelAndCopyToWasmMemory(c){return Ji(await Lr(c))}async loadModel(c,g){Je();let b;typeof c=="string"?b=await this.fetchModelAndCopyToWasmMemory(c):b=c,[this.sessionId,this.inputNames,this.outputNames,this.inputMetadata,this.outputMetadata]=await ea(b,g),Ze()}async dispose(){return Ta(this.sessionId)}async run(c,g,b){Je();let T=[],v=[];Object.entries(c).forEach(q=>{let P=q[0],J=q[1],z=this.inputNames.indexOf(P);if(z===-1)throw new Error(`invalid input '${P}'`);T.push(J),v.push(z)});let A=[],k=[];Object.entries(g).forEach(q=>{let P=q[0],J=q[1],z=this.outputNames.indexOf(P);if(z===-1)throw new Error(`invalid output '${P}'`);A.push(J),k.push(z)});let E=T.map((q,P)=>ia(q,()=>`input "${this.inputNames[v[P]]}"`)),O=A.map((q,P)=>q?ia(q,()=>`output "${this.outputNames[k[P]]}"`):null),L=await lr(this.sessionId,v,E,k,O,b),F={};for(let q=0;q<L.length;q++)F[this.outputNames[k[q]]]=A[q]??hi(L[q]);return Ze(),F}startProfiling(){}endProfiling(){ta(this.sessionId)}}}),Fr={};ye(Fr,{OnnxruntimeWebAssemblyBackend:()=>yi,initializeFlags:()=>gi,wasmBackend:()=>wi});var gi,yi,wi,aa=I(()=>{Qe(),ra(),mi(),gi=()=>{(typeof te.wasm.initTimeout!="number"||te.wasm.initTimeout<0)&&(te.wasm.initTimeout=0);let c=te.wasm.simd;if(typeof c!="boolean"&&c!==void 0&&c!=="fixed"&&c!=="relaxed"&&(console.warn(`Property "env.wasm.simd" is set to unknown value "${c}". Reset it to \`false\` and ignore SIMD feature checking.`),te.wasm.simd=!1),typeof te.wasm.proxy!="boolean"&&(te.wasm.proxy=!1),typeof te.wasm.trace!="boolean"&&(te.wasm.trace=!1),typeof te.wasm.numThreads!="number"||!Number.isInteger(te.wasm.numThreads)||te.wasm.numThreads<=0)if(typeof self<"u"&&!self.crossOriginIsolated)te.wasm.numThreads=1;else{let g=typeof navigator>"u"?oe("node:os").cpus().length:navigator.hardwareConcurrency;te.wasm.numThreads=Math.min(4,Math.ceil((g||1)/2))}},yi=class{async init(c){gi(),await pi(),await ci(c)}async createInferenceSessionHandler(c,g){let b=new fi;return await b.loadModel(c,g),b}},wi=new yi}),na={};ye(na,{InferenceSession:()=>xr,TRACE:()=>Gt,TRACE_EVENT_BEGIN:()=>lt,TRACE_EVENT_END:()=>dt,TRACE_FUNC_BEGIN:()=>Je,TRACE_FUNC_END:()=>Ze,Tensor:()=>We,default:()=>un,env:()=>te,registerBackend:()=>we}),Qe(),Qe(),Qe();var Ea="1.23.2",un=Ai;{let c=(aa(),Le(Fr)).wasmBackend;we("cpu",c,10),we("wasm",c,10)}return Object.defineProperty(te.versions,"web",{value:Ea,enumerable:!0}),Le(na)})();R.exports=G})(gc);var Oh=gc.exports;(function(R){var B=ht&&ht.__createBinding||(Object.create?function(ke,Ie,me,ce){ce===void 0&&(ce=me);var Ne=Object.getOwnPropertyDescriptor(Ie,me);(!Ne||("get"in Ne?!Ie.__esModule:Ne.writable||Ne.configurable))&&(Ne={enumerable:!0,get:function(){return Ie[me]}}),Object.defineProperty(ke,ce,Ne)}:function(ke,Ie,me,ce){ce===void 0&&(ce=me),ke[ce]=Ie[me]}),G=ht&&ht.__setModuleDefault||(Object.create?function(ke,Ie){Object.defineProperty(ke,"default",{enumerable:!0,value:Ie})}:function(ke,Ie){ke.default=Ie}),j=ht&&ht.__importStar||function(ke){if(ke&&ke.__esModule)return ke;var Ie={};if(ke!=null)for(var me in ke)me!=="default"&&Object.prototype.hasOwnProperty.call(ke,me)&&B(Ie,ke,me);return G(Ie,ke),Ie};Object.defineProperty(R,"__esModule",{value:!0}),R.MicVAD=R.getDefaultRealTimeVADOptions=R.ort=R.DEFAULT_MODEL=void 0;const K=j(Oh),Y=xi,Q=Yt,oe=yr,I=ri,ye=ms,Ye=Sa;R.DEFAULT_MODEL="legacy",R.ort=K;const Le="vad.worklet.bundle.min.js",Se="silero_vad_v5.onnx",$e="silero_vad_legacy.onnx",we=ke=>({...Q.defaultFrameProcessorOptions,onFrameProcessed:()=>{},onVADMisfire:()=>{oe.log.debug("VAD misfire")},onSpeechStart:()=>{oe.log.debug("Detected speech start")},onSpeechEnd:()=>{oe.log.debug("Detected speech end")},onSpeechRealStart:()=>{oe.log.debug("Detected real speech start")},baseAssetPath:"./",onnxWASMBasePath:"./",model:ke,workletOptions:{},getStream:async()=>await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:!0,autoGainControl:!0,noiseSuppression:!0}}),pauseStream:async Ie=>{Ie.getTracks().forEach(me=>{me.stop()})},resumeStream:async()=>await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:!0,autoGainControl:!0,noiseSuppression:!0}}),ortConfig:Ie=>{Ie.env.logLevel="error"},startOnLoad:!0,processorType:"auto"});R.getDefaultRealTimeVADOptions=we;const Pe=ke=>"audioWorklet"in ke&&typeof AudioWorkletNode=="function"?"AudioWorklet":"ScriptProcessor";async function Ge(ke,Ie,me,ce,Ne){await me.audioWorklet.addModule(ke),Ie.processorOptions={...Ie.processorOptions??{},frameSamples:ce};const te=new AudioWorkletNode(me,"vad-helper-worklet",Ie);return te.port.onmessage=async ot=>{const qe=ot.data;if(!(typeof qe=="object"&&qe&&"message"in qe)){console.error("Invalid message event",qe);return}switch(qe.message){case I.Message.AudioFrame:{if(!("data"in qe&&qe.data instanceof ArrayBuffer)){console.log("Audio frame message has no data");return}const ft=new Float32Array(qe.data);await Ne(ft);break}}},te}async function yt(ke,Ie,me){const ce=new Ye.Resampler({nativeSampleRate:ke.sampleRate,targetSampleRate:16e3,targetFrameSize:Ie});oe.log.debug("using script processor");const te=ke.createScriptProcessor(4096,1,1);let ot=!1;return te.onaudioprocess=async qe=>{if(!ot){ot=!0;try{const ft=qe.inputBuffer.getChannelData(0);qe.outputBuffer.getChannelData(0).fill(0);const ut=ce.process(ft);for(const wt of ut)await me(wt)}catch(ft){console.error("Error processing audio:",ft)}finally{ot=!1}}},te.connect(ke.destination),te}class At{constructor(Ie,me,ce,Ne,te=!1,ot=null,qe=null,ft=null,nr=null,ut=null,wt=null,wr="uninitialized",_r=!1){this.options=Ie,this.frameProcessor=me,this.model=ce,this.frameSamples=Ne,this.listening=te,this.errored=ot,this._stream=qe,this._audioContext=ft,this._vadNode=nr,this._mediaStreamAudioSourceNode=ut,this._audioProcessorAdapterType=wt,this.initializationState=wr,this.ownsAudioContext=_r,this.getAudioInstances=()=>{if(this._stream===null||this._audioContext===null||this._vadNode==null||this._mediaStreamAudioSourceNode==null)throw new Error("MicVAD has null stream, audio context, or processor adapter");return{stream:this._stream,audioContext:this._audioContext,vadNode:this._vadNode,mediaStreamAudioSourceNode:this._mediaStreamAudioSourceNode}},this.setErrored=Oe=>{this.initializationState="errored",this.errored=Oe},this.start=async()=>{switch(this.initializationState){case"uninitialized":{oe.log.debug("initializing micVAD"),this.initializationState="initializing",this.frameProcessor.resume();try{this._stream=await this.options.getStream()}catch(Oe){throw Oe instanceof Error?this.setErrored(Oe.message):this.setErrored(String(Oe)),Oe}if(this.options.audioContext?(console.log("using custom audio context"),this._audioContext=this.options.audioContext):(console.log("using default audio context"),this._audioContext=new AudioContext,this.ownsAudioContext=!0),!this._audioContext)throw this.setErrored("Audio context is null"),Error("Audio context is null");switch(this._audioProcessorAdapterType=this.options.processorType=="auto"?Pe(this._audioContext):this.options.processorType,this._audioProcessorAdapterType){case"AudioWorklet":this._vadNode=await Ge(this.options.baseAssetPath+Le,this.options.workletOptions,this._audioContext,this.frameSamples,this.processFrame);break;case"ScriptProcessor":this._vadNode=await yt(this._audioContext,this.frameSamples,this.processFrame);break;default:throw new Error(`Unsupported audio processor adapter type: ${this._audioProcessorAdapterType}`)}this._mediaStreamAudioSourceNode=new MediaStreamAudioSourceNode(this._audioContext,{mediaStream:this._stream}),this._mediaStreamAudioSourceNode.connect(this._vadNode),oe.log.debug("started micVAD"),this.listening=!0,this.initializationState="initialized";break}case"initializing":{oe.log.warn("start called while initializing");break}case"initialized":{if(this.listening)return;this.listening=!0,this.frameProcessor.resume();const{stream:Oe,audioContext:It,vadNode:Si}=this.getAudioInstances();this._stream=await this.options.resumeStream(Oe);const tt=new MediaStreamAudioSourceNode(It,{mediaStream:this._stream});this._mediaStreamAudioSourceNode=tt,tt.connect(Si);break}case"destroyed":{oe.log.warn("start called after destroyed");break}case"errored":{oe.log.error("start called after errored");break}default:{oe.log.warn("weird initialization state");break}}},this.pause=async()=>{if(!this.listening)return;this.listening=!1;const{stream:Oe,mediaStreamAudioSourceNode:It}=this.getAudioInstances();await this.options.pauseStream(Oe),It.disconnect(),this.frameProcessor.pause(this.handleFrameProcessorEvent)},this.destroy=async()=>{var It;oe.log.debug("destroy called"),this.initializationState="destroyed";const{vadNode:Oe}=this.getAudioInstances();Oe instanceof AudioWorkletNode&&Oe.port.postMessage(I.Message.SpeechStop),this.listening&&await this.pause(),await this.model.release(),this.ownsAudioContext&&await((It=this._audioContext)==null?void 0:It.close())},this.setOptions=Oe=>{this.frameProcessor.setOptions(Oe)},this.processFrame=async Oe=>{await this.frameProcessor.process(Oe,this.handleFrameProcessorEvent)},this.handleFrameProcessorEvent=Oe=>{switch(Oe.msg){case I.Message.FrameProcessed:this.options.onFrameProcessed(Oe.probs,Oe.frame);break;case I.Message.SpeechStart:this.options.onSpeechStart();break;case I.Message.SpeechRealStart:this.options.onSpeechRealStart();break;case I.Message.VADMisfire:this.options.onVADMisfire();break;case I.Message.SpeechEnd:this.options.onSpeechEnd(Oe.audio);break}}}static async new(Ie={}){const me={...(0,R.getDefaultRealTimeVADOptions)(Ie.model??R.DEFAULT_MODEL),...Ie};(0,Q.validateOptions)(me),R.ort.env.wasm.wasmPaths=me.onnxWASMBasePath,me.ortConfig!==void 0&&me.ortConfig(R.ort);const ce=me.model==="v5"?Se:$e,Ne=me.baseAssetPath+ce,te=me.model==="v5"?ye.SileroV5.new:ye.SileroLegacy.new;let ot;try{ot=await te(R.ort,()=>(0,Y.defaultModelFetcher)(Ne))}catch(wt){throw console.error(`Encountered an error while loading model file ${Ne}`),wt}const qe=me.model==="v5"?512:1536,ft=qe/16,nr=new Q.FrameProcessor(ot.process,ot.reset_state,{positiveSpeechThreshold:me.positiveSpeechThreshold,negativeSpeechThreshold:me.negativeSpeechThreshold,redemptionMs:me.redemptionMs,preSpeechPadMs:me.preSpeechPadMs,minSpeechMs:me.minSpeechMs,submitUserSpeechOnPause:me.submitUserSpeechOnPause},ft),ut=new At(me,nr,ot,qe);if(me.startOnLoad)try{await ut.start()}catch(wt){throw console.error("Error starting micVad",wt),wt}return ut}}R.MicVAD=At})(mc);(function(R){Object.defineProperty(R,"__esModule",{value:!0}),R.getDefaultRealTimeVADOptions=R.MicVAD=R.DEFAULT_MODEL=R.utils=R.NonRealTimeVAD=R.Message=R.FrameProcessor=R.defaultModelFetcher=R.baseAssetPath=void 0;var B=xa;Object.defineProperty(R,"baseAssetPath",{enumerable:!0,get:function(){return B.baseAssetPath}});var G=xi;Object.defineProperty(R,"defaultModelFetcher",{enumerable:!0,get:function(){return G.defaultModelFetcher}});var j=Yt;Object.defineProperty(R,"FrameProcessor",{enumerable:!0,get:function(){return j.FrameProcessor}});var K=ri;Object.defineProperty(R,"Message",{enumerable:!0,get:function(){return K.Message}});var Y=oc;Object.defineProperty(R,"NonRealTimeVAD",{enumerable:!0,get:function(){return Y.NonRealTimeVAD}});const Q=Xt;R.utils={audioFileToArray:Q.audioFileToArray,minFramesForTargetMS:Q.minFramesForTargetMS,arrayBufferToBase64:Q.arrayBufferToBase64,encodeWAV:Q.encodeWAV};var oe=mc;Object.defineProperty(R,"DEFAULT_MODEL",{enumerable:!0,get:function(){return oe.DEFAULT_MODEL}}),Object.defineProperty(R,"MicVAD",{enumerable:!0,get:function(){return oe.MicVAD}}),Object.defineProperty(R,"getDefaultRealTimeVADOptions",{enumerable:!0,get:function(){return oe.getDefaultRealTimeVADOptions}})})(nc);const cs={model:"v5",redemptionMs:1200,preSpeechPadMs:800,minSpeechMs:400,positiveSpeechThreshold:.3,negativeSpeechThreshold:.25,submitUserSpeechOnPause:!0,silenceAfterSpeechToStopMicMs:2500,baseAssetPath:"https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.30/dist/",onnxWASMBasePath:"https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/"},ac="2025-04-16",Rh="",Bh="95131c95-525c-463b-893d-803bafdf93c4",Mh=100,Dh="wss://api.cartesia.ai/tts/websocket",Ph="wss://api.cartesia.ai/stt/websocket";class Uh{constructor(B={}){this.options=B,this.apiKey=B.apiKey??Rh,this.voiceId=B.voiceId||Bh,this.language=B.language||"en",this.ttsModel=B.ttsModel||"sonic-turbo",this.audioContext=null,this.sttNode=null,this.ttsNode=null,this.mediaStream=null,this.sttWs=null,this.ttsWs=null,this.vad=null,this.contextIdCounter=0,this._ttsDoneResolvers=new Map,this._ttsConnectPromise=null,this._sttStreaming=!1,this._preSpeechBuffer=[],this._preSpeechMaxChunks=Math.ceil(cs.preSpeechPadMs/Mh),this.onTranscript=B.onTranscript||(()=>{}),this.onTTSChunk=B.onTTSChunk||(()=>{}),this.onError=B.onError||(()=>{}),this.onSpeechStart=B.onSpeechStart||(()=>{}),this.onSpeechEnd=B.onSpeechEnd||(()=>{}),this.onVADMisfire=B.onVADMisfire||(()=>{}),this.onSTTStopped=B.onSTTStopped||(()=>{}),this.onPartialTranscript=B.onPartialTranscript||(()=>{}),this._sttActive=!1,this._silenceStopTimer=null}isSTTActive(){return this._sttActive===!0}async init(){if(this.audioContext)return;this.audioContext=new AudioContext,this.audioContext.state==="suspended"&&await this.audioContext.resume();const B=this.options.audioWorkletBasePath||"./audio/";return await this.audioContext.audioWorklet.addModule(`${B}stt-capture-processor.js`),await this.audioContext.audioWorklet.addModule(`${B}tts-playback-processor.js`),this.ttsNode=new AudioWorkletNode(this.audioContext,"tts-playback-processor"),this.ttsNode.connect(this.audioContext.destination),this.audioContext}async connectSTTWebSocket(){const B=new URL(Ph);return B.searchParams.set("api_key",this.apiKey),B.searchParams.set("cartesia_version",ac),this.sttWs=new WebSocket(B.toString()),new Promise((G,j)=>{this.sttWs.onopen=()=>{this.sttWs.send(JSON.stringify({model:"ink-whisper",language:this.language,encoding:"pcm_s16le",sample_rate:"16000",min_volume:"0.0",max_silence_duration_secs:"2.0"})),G()},this.sttWs.onmessage=K=>{if(typeof K.data=="string")try{const Y=JSON.parse(K.data);Y.type==="transcript"&&(this.onPartialTranscript(Y.text,Y.is_final),this.onTranscript(Y.text,Y.is_final,Y.request_id||""))}catch{}},this.sttWs.onerror=()=>j(new Error("STT WebSocket error"))})}_sendChunkToSTT(B){!this.sttWs||this.sttWs.readyState!==WebSocket.OPEN||!this._sttStreaming||this.sttWs.send(B)}_flushPreSpeechBuffer(){for(const B of this._preSpeechBuffer)this._sendChunkToSTT(B);this._preSpeechBuffer=[]}async startSTT(){if(!this._sttActive){if(!this.apiKey)throw new Error("CARTESIA_API_KEY is required.");try{await this.init(),await this.connectSTTWebSocket();const B=await navigator.mediaDevices.getUserMedia({audio:!0});this.mediaStream=B;const G=this.audioContext.createMediaStreamSource(B);this.sttNode=new AudioWorkletNode(this.audioContext,"stt-capture-processor"),G.connect(this.sttNode),this._preSpeechBuffer=[],this._sttStreaming=!1,this.sttNode.port.onmessage=K=>{if(K.data.type!=="audio"||!K.data.data)return;const Y=K.data.data;this._sttStreaming?this._sendChunkToSTT(Y):(this._preSpeechBuffer.push(Y),this._preSpeechBuffer.length>this._preSpeechMaxChunks&&this._preSpeechBuffer.shift())};const j={...cs,getStream:()=>Promise.resolve(B),onSpeechStart:()=>{this._clearSilenceStopTimer(),this.onSpeechStart(),this._bargeIn(),this._sttStreaming=!0,this._flushPreSpeechBuffer()},onSpeechEnd:()=>{var Y;this.onSpeechEnd(),this._sttStreaming=!1,((Y=this.sttWs)==null?void 0:Y.readyState)===WebSocket.OPEN&&this.sttWs.send("finalize");const K=cs.silenceAfterSpeechToStopMicMs??2500;K>0&&(this._clearSilenceStopTimer(),this._silenceStopTimer=setTimeout(()=>{this._silenceStopTimer=null,this.stopSTT()},K))},onVADMisfire:()=>this.onVADMisfire()};this.vad=await nc.MicVAD.new(j),this.vad.start(),this._sttActive=!0}catch(B){throw this.stopSTT(),B}}}_clearSilenceStopTimer(){this._silenceStopTimer&&(clearTimeout(this._silenceStopTimer),this._silenceStopTimer=null)}_bargeIn(){this.clearTTSBuffer(),[...this._ttsDoneResolvers.keys()].forEach(G=>{this.cancelTTS(G);const j=this._ttsDoneResolvers.get(G);j&&j.reject(new Error("Barge-in: user spoke")),this._ttsDoneResolvers.delete(G)})}stopSTT(){this._clearSilenceStopTimer();const B=this._sttActive;if(this._sttActive=!1,this.vad&&(this.vad.pause(),this.vad=null),this._sttStreaming=!1,this._preSpeechBuffer=[],this.mediaStream&&(this.mediaStream.getTracks().forEach(G=>G.stop()),this.mediaStream=null),this.sttNode&&(this.sttNode.disconnect(),this.sttNode=null),this.sttWs){try{this.sttWs.send("done")}catch{}this.sttWs.close(),this.sttWs=null}B&&this.onSTTStopped()}async connectTTS(){var G;if(!this.apiKey)throw new Error("CARTESIA_API_KEY is required.");if(await this.init(),((G=this.ttsWs)==null?void 0:G.readyState)===WebSocket.OPEN)return;if(this._ttsConnectPromise)return this._ttsConnectPromise;const B=new URL(Dh);return B.searchParams.set("api_key",this.apiKey),B.searchParams.set("cartesia_version",ac),this.ttsWs=new WebSocket(B.toString()),this._ttsConnectPromise=new Promise((j,K)=>{this.ttsWs.onopen=()=>{this._ttsConnectPromise=null,j()},this.ttsWs.onerror=()=>{this._ttsConnectPromise=null,K(new Error("TTS WebSocket error"))},this.ttsWs.onclose=()=>{this._ttsConnectPromise=null},this.ttsWs.onmessage=Y=>{if(typeof Y.data=="string")try{const Q=JSON.parse(Y.data);if(Q.type==="chunk"&&Q.data){const oe=wh(Q.data);this.playTTSChunk(oe),this.onTTSChunk(Q)}else if(Q.type==="done"&&Q.context_id){const oe=this._ttsDoneResolvers.get(Q.context_id);oe&&(this._ttsDoneResolvers.delete(Q.context_id),oe.resolve())}else if((Q.type==="error"||Q.error)&&Q.context_id){const oe=this._ttsDoneResolvers.get(Q.context_id);oe&&(this._ttsDoneResolvers.delete(Q.context_id),oe.reject(new Error(Q.error||"TTS error"))),this.onError(Q.error||"TTS error")}}catch(Q){this.onError(Q)}}}),this._ttsConnectPromise}playTTSChunk(B){this.ttsNode&&this.ttsNode.port.postMessage({type:"audio",samples:Array.from(B)})}clearTTSBuffer(){this.ttsNode&&this.ttsNode.port.postMessage({type:"clear"})}async speakText(B,G=null,j=!1){await this.connectTTS();const K=G||`ctx_${++this.contextIdCounter}_${Date.now()}`;return this.ttsWs.send(JSON.stringify({model_id:this.ttsModel,transcript:B,voice:{mode:"id",id:this.voiceId},language:this.language,context_id:K,output_format:{container:"raw",encoding:"pcm_s16le",sample_rate:8e3},add_timestamps:!0,continue:j,max_buffer_delay_ms:0})),j?Promise.resolve():new Promise((Y,Q)=>{this._ttsDoneResolvers.set(K,{resolve:Y,reject:Q})})}async streamTextChunks(B,G=null){const j=G||`ctx_${++this.contextIdCounter}_${Date.now()}`;for(let K=0;K<B.length;K++)await this.speakText(B[K],j,K<B.length-1);return j}cancelTTS(B){var G;((G=this.ttsWs)==null?void 0:G.readyState)===WebSocket.OPEN&&this.ttsWs.send(JSON.stringify({context_id:B,cancel:!0})),this.clearTTSBuffer()}disconnectTTS(){this._ttsDoneResolvers.forEach(({reject:B})=>B(new Error("TTS disconnected"))),this._ttsDoneResolvers.clear(),this._ttsConnectPromise=null,this.ttsWs&&(this.ttsWs.close(),this.ttsWs=null)}destroy(){this.stopSTT(),this.disconnectTTS(),this.ttsNode&&(this.ttsNode.disconnect(),this.ttsNode=null),this.audioContext&&(this.audioContext.close(),this.audioContext=null)}}const qa=document.getElementById("chatContainer"),$a=document.getElementById("textInput"),wc=document.getElementById("btnSend"),mr=document.getElementById("btnMic"),Nh=document.getElementById("btnPaperclip"),ja=document.getElementById("fileInput"),Ha=document.getElementById("status"),ws=typeof import.meta<"u"?"sk_car_GYAnGSmHkAFGYbr52wL9HG":"",Lh=typeof import.meta<"u"?"95131c95-525c-463b-893d-803bafdf93c4":"",Vh="https://n8n.hempstarai.com/webhook/e7278dba-076f-4fe9-8c8f-0241e4103ac4";function Xe(R,B=""){Ha&&(Ha.textContent=R,Ha.className="status "+B)}function vi(R,B,G=[]){if(!qa)return null;const j=document.createElement("div");j.className="message "+R;const K=R==="user"?"You":"JARVIS";let Y="";return G.length&&(Y='<div class="attachments">'+G.map(Q=>{if(Q&&typeof Q=="object"&&Q.type&&Q.type.startsWith("image/"))return`<img src="${Q.url||URL.createObjectURL(Q)}" alt="Attachment" />`;const I=typeof Q=="string"?Q:Q&&Q.name||"File";return`<span class="file-name">${hs(I)}</span>`}).join("")+"</div>"),j.innerHTML=`<div class="label">${hs(K)}</div><div class="content">${hs(B)}</div>${Y}`,qa.appendChild(j),qa.scrollTop=qa.scrollHeight,j}function hs(R){const B=document.createElement("div");return B.textContent=R,B.innerHTML}const Wh=["output","reply","result","text","message","response","answer","content"];function fs(R){if(!R||typeof R!="object")return null;for(const B of Wh){const G=R[B];if(typeof G=="string")return G}if(Array.isArray(R)&&R.length){const B=R[0];if(typeof B=="string")return B;if(B&&typeof B=="object")return fs(B)}for(const B of Object.values(R)){if(typeof B=="string")return B;if(B&&typeof B=="object"&&!Array.isArray(B)){const G=fs(B);if(G)return G}}return null}async function _c(R){const B=(R||"").trim();if(!B)return"I didn't catch that. Try again?";try{const j=await(await fetch(Vh,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:B})})).json().catch(()=>({})),K=fs(j);return typeof K=="string"?K:`You said: "${B}". I'm connected to n8n — configure your workflow to return a reply (e.g. {"reply": "..."} or {"output": "..."}).`}catch(G){return console.error("[JARVIS] n8n webhook error:",G),"Sorry, I couldn't reach the assistant. Please try again."}}const gr=new Uh({apiKey:ws||void 0,voiceId:Lh||void 0,ttsModel:"sonic-turbo",audioWorkletBasePath:new URL("audio/",document.baseURI).href,onPartialTranscript:(R,B)=>{!B&&R.trim()&&Xe(`Listening… "${R.slice(0,40)}${R.length>40?"…":""}"`,"listening")},onTranscript:async(R,B)=>{if(!B||!R.trim())return;vi("user",R),Xe("Processing…","listening");const G=await _c(R);Xe("Speaking…","speaking"),gr.speakText(G).then(()=>{Xe("Ready"),vi("assistant",G)}).catch(j=>{Xe("Error","error"),vi("assistant","Sorry, I could not speak that. "+((j==null?void 0:j.message)||j))})},onTTSChunk:()=>{},onError:R=>{console.error("[JARVIS]",R),Xe("Error","error"),gr.isSTTActive()&&gr.stopSTT()},onSTTStopped:()=>{mr.classList.remove("active","recording"),mr.disabled=!1,Xe("Ready")},onSpeechStart:()=>Xe("Listening…","listening"),onSpeechEnd:()=>Xe("Processing…","listening"),onVADMisfire:()=>{Xe("Try again — speak a bit longer","status-misfire"),setTimeout(()=>{Ha.textContent.includes("Try again")&&Xe("Listening…","listening")},2500)}});let va=[];wc.addEventListener("click",async()=>{const R=$a.value.trim();if(!R)return;if(!ws){Xe("Add CARTESIA_API_KEY to .env","error");return}$a.value="",$a.placeholder="Type or speak...",vi("user",R,va.length?va:[]),va=[],Xe("Processing…","listening");const B=await _c(R);Xe("Speaking…","speaking");try{await gr.speakText(B),Xe("Ready"),vi("assistant",B)}catch(G){Xe("Error","error"),vi("assistant","Sorry, something went wrong. "+((G==null?void 0:G.message)||G))}});$a.addEventListener("keydown",R=>{R.key==="Enter"&&!R.shiftKey&&(R.preventDefault(),wc.click())});mr.addEventListener("click",async()=>{if(mr.classList.contains("active")){gr.stopSTT();return}if(!ws){Xe("Add CARTESIA_API_KEY to .env","error");return}mr.disabled=!0;try{Xe("Connecting…"),await gr.connectTTS().catch(()=>{}),await gr.startSTT(),mr.classList.add("active","recording"),Xe("Listening…","listening")}catch(B){Xe("Mic error: "+((B==null?void 0:B.message)||B),"error"),mr.classList.remove("active","recording")}finally{mr.disabled=!1}});Nh.addEventListener("click",()=>ja.click());ja.addEventListener("change",()=>{const R=Array.from(ja.files||[]);if(!R.length)return;va.push(...R);const B=va.length;$a.placeholder=B?`${B} file(s) attached — type a message...`:"Type or speak...",ja.value=""});window.addEventListener("beforeunload",()=>gr.destroy());
