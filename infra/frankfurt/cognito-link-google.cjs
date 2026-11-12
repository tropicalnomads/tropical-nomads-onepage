const crypto=require('crypto');
function linkDecision(input){
  if(input.trigger!=='PreSignUp_ExternalProvider')return{action:'ignore'};
  const userName=String(input.userName||'');
  const subject=userName.toLowerCase().startsWith('google_')?userName.slice(7):'';
  if(!/^[A-Za-z0-9:._-]{1,200}$/.test(subject))return{action:'ignore'};
  const email=String(input.email||'').trim().toLowerCase();
  if(!email.includes('@'))return{action:'ignore'};
  const matches=(input.users||[]).filter((user)=>user.emailVerified===true&&String(user.email||'').toLowerCase()===email&&user.username!==userName);
  if(matches.length===1)return{action:'link',username:matches[0].username,subject};
  if(matches.length>1)return{action:'ignore'};
  return{action:'confirm'};
}
function hmac(key,data){return crypto.createHmac('sha256',key).update(data).digest()}
function sha(data){return crypto.createHash('sha256').update(data).digest('hex')}
async function post(target,body){
  const region=process.env.AWS_REGION,host='cognito-idp.'+region+'.amazonaws.com',amz=new Date().toISOString().replace(/[:-]|\.\d{3}/g,''),day=amz.slice(0,8),payload=JSON.stringify(body),token=process.env.AWS_SESSION_TOKEN||'';
  const names=['content-type','host','x-amz-date','x-amz-security-token','x-amz-target'];
  const values=['application/x-amz-json-1.1',host,amz,token,target];
  const canonical=['POST','/','',names.map((name,index)=>name+':'+values[index]).join('\n')+'\n',names.join(';'),sha(payload)].join('\n');
  const scope=day+'/'+region+'/cognito-idp/aws4_request';
  let key=hmac('AWS4'+process.env.AWS_SECRET_ACCESS_KEY,day);
  key=hmac(key,region);key=hmac(key,'cognito-idp');key=hmac(key,'aws4_request');
  const response=await fetch('https://'+host+'/',{method:'POST',headers:{'content-type':values[0],'x-amz-date':amz,'x-amz-security-token':token,'x-amz-target':target,authorization:'AWS4-HMAC-SHA256 Credential='+process.env.AWS_ACCESS_KEY_ID+'/'+scope+', SignedHeaders='+names.join(';')+', Signature='+crypto.createHmac('sha256',key).update(['AWS4-HMAC-SHA256',amz,scope,sha(canonical)].join('\n')).digest('hex')},body:payload});
  const text=await response.text();
  if(!response.ok)throw new Error(text.slice(0,300));
  return text?JSON.parse(text):{};
}
exports.linkDecision=linkDecision;
exports.handler=async(event)=>{
  const email=String(event.request&&event.request.userAttributes&&event.request.userAttributes.email||'');
  let users=[];
  if(event.triggerSource==='PreSignUp_ExternalProvider'){
    const body=await post('AWSCognitoIdentityProviderService.ListUsers',{UserPoolId:event.userPoolId,Filter:'email = "'+email.replace(/["\\]/g,'').trim()+'"',Limit:20});
    users=(Array.isArray(body.Users)?body.Users:[]).map((user)=>{
      const attributes=Array.isArray(user.Attributes)?user.Attributes:[];
      const read=(name)=>{const found=attributes.find((item)=>item.Name===name);return found&&typeof found.Value==='string'?found.Value:'';};
      return{username:String(user.Username||''),email:read('email'),emailVerified:read('email_verified')==='true'};
    });
  }
  const decision=linkDecision({trigger:event.triggerSource,userName:event.userName,email,users});
  if(decision.action==='confirm'){event.response.autoConfirmUser=true;event.response.autoVerifyEmail=true;return event;}
  if(decision.action!=='link')return event;
  try{await post('AWSCognitoIdentityProviderService.AdminLinkProviderForUser',{UserPoolId:event.userPoolId,DestinationUser:{ProviderName:'Cognito',ProviderAttributeValue:decision.username},SourceUser:{ProviderName:'Google',ProviderAttributeName:'Cognito_Subject',ProviderAttributeValue:decision.subject}});}
  catch(error){if(!/already/i.test(String(error&&error.message?error.message:error)))throw error;}
  throw new Error('ACCOUNT_LINKED');
};
