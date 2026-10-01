import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, AppState } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Picker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Sharing from 'expo-sharing';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState, useAudioPlayer } from 'expo-audio';
import { Sighting, list, save, exportBackup, getLanguage, setLanguage } from './src/storage';
type Fix={latitude:number;longitude:number;accuracy:number|null;gpsAt:string};
const animals=['Onça-pintada','Arara-azul','Tuiuiú','Jacaré','Capivara','Anta','Cervo-do-pantanal','Tamanduá-bandeira'];
function AudioClip({uri,label}:{uri:string;label:string}) {
 const player=useAudioPlayer(uri);
 return <Button label={label} onPress={()=>{player.seekTo(0);player.play();}}/>;
}
function Button({label,onPress,disabled=false}:{label:string;onPress:()=>void;disabled?:boolean}) {
 return <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onPress} style={[s.button,disabled&&{opacity:.45}]}><Text style={s.buttonText}>{label}</Text></TouchableOpacity>;
}
function Main() {
 const [lang,updateLang]=useState<'pt'|'en'>('pt');
 const t=(pt:string,en:string)=>lang==='en'?en:pt;
 const species=(name:string)=>lang==='en' ? ({'Onça-pintada':'Jaguar','Arara-azul':'Hyacinth macaw','Tuiuiú':'Jabiru','Jacaré':'Caiman','Capivara':'Capybara','Anta':'Tapir','Cervo-do-pantanal':'Marsh deer','Tamanduá-bandeira':'Giant anteater','Identificação por áudio':'Audio identification'} as Record<string,string>)[name]??name : name;
 useEffect(()=>{getLanguage().then(updateLang).catch(()=>{});},[]);
 async function chooseLanguage(value:'pt'|'en'){try{await setLanguage(value);updateLang(value);}catch(e){error(e);}}

 const [tab,setTab]=useState('capture'); const [rows,setRows]=useState<Sighting[]>([]);
 const [photo,setPhoto]=useState<string|null>(null); const [audio,setAudio]=useState<string|null>(null);
 const [animal,setAnimal]=useState(''); const [notes,setNotes]=useState(''); const [createdAt,setCreatedAt]=useState('');
 const [fix,setFix]=useState<Fix|null>(null); const [gps,setGps]=useState('Sem posição');
 const [busy,setBusy]=useState(false); const [locating,setLocating]=useState(false);
 const lock=useRef(false); const locationRequest=useRef(0);
 const recorder=useAudioRecorder(RecordingPresets.HIGH_QUALITY); const rec=useAudioRecorderState(recorder);
 const refresh=async()=>setRows(await list());
 const error=(e:unknown)=>{
  const message=e instanceof Error?e.message:String(e);
  const errors:Record<string,string>={'Armazenamento do aparelho indisponível.':'Device storage unavailable.','Pasta temporária indisponível.':'Temporary directory unavailable.'};
  Alert.alert(t('Não foi possível concluir','Unable to complete'),lang==='en'?errors[message]??message:message);
 };
 useEffect(()=>{refresh().catch(error);},[]);
 useEffect(()=>{const sub=AppState.addEventListener('change',state=>{if(state!=='active'&&recorder.isRecording)recorder.stop().then(()=>{setAudio(recorder.uri);}).catch(error);});return()=>sub.remove();},[recorder]);
 async function locate() {
  const request=++locationRequest.current; setLocating(true);setFix(null);setGps('Buscando GPS…');
  let subscription:Location.LocationSubscription|undefined;
  try {
   const permission=await Location.requestForegroundPermissionsAsync();
   if(!permission.granted)throw new Error(t('Permissão de localização negada','Location permission denied'));
   const result=await new Promise<Location.LocationObject>((resolve,reject)=>{
    let settled=false;
    const timer=setTimeout(()=>{settled=true;subscription?.remove();reject(new Error(t('GPS indisponível. Vá a uma área aberta e tente novamente.','GPS unavailable. Move to an open area and try again.')));},25000);
    Location.watchPositionAsync({accuracy:Location.Accuracy.High,timeInterval:1000,distanceInterval:0},position=>{
     if(settled || Date.now()-position.timestamp>30000)return;
     settled=true;clearTimeout(timer);subscription?.remove();resolve(position);
    }).then(sub=>{subscription=sub;if(settled)sub.remove();}).catch(e=>{if(!settled){settled=true;clearTimeout(timer);reject(e);}});
   });
   if(request===locationRequest.current){setFix({latitude:result.coords.latitude,longitude:result.coords.longitude,accuracy:result.coords.accuracy,gpsAt:new Date(result.timestamp).toISOString()});setGps('Posição registrada');}
  }catch(e){if(request===locationRequest.current)setGps(e instanceof Error?e.message:t('Sem GPS','No GPS'));}
  finally{subscription?.remove();if(request===locationRequest.current)setLocating(false);}
 }
 async function photograph() {
  if(lock.current)return;lock.current=true;setBusy(true);
  try {
   const permission=await Picker.requestCameraPermissionsAsync();if(!permission.granted)throw new Error(t('Autorize a câmera para fotografar.','Allow camera access to take photos.'));
   const result=await Picker.launchCameraAsync({mediaTypes:['images'],quality:1,allowsEditing:false});
   if(!result.canceled){setPhoto(result.assets[0].uri);setCreatedAt(new Date().toISOString());setFix(null);await locate();}
  }catch(e){error(e);}finally{lock.current=false;setBusy(false);}
 }
 async function toggleAudio() {
  if(lock.current)return;lock.current=true;setBusy(true);
  try {
   if(recorder.isRecording){await recorder.stop();setAudio(recorder.uri);}
   else{const permission=await AudioModule.requestRecordingPermissionsAsync();if(!permission.granted)throw new Error(t('Autorize o microfone.','Allow microphone access.'));await setAudioModeAsync({allowsRecording:true,playsInSilentMode:true});await recorder.prepareToRecordAsync();recorder.record();}
  }catch(e){error(e);}finally{lock.current=false;setBusy(false);}
 }
 async function commit() {
  if(lock.current||!photo)return;lock.current=true;setBusy(true);
  try {
   await save({createdAt,animal:animal.trim()||'Identificação por áudio',notes:notes.trim(),photo,audio,latitude:fix?.latitude??null,longitude:fix?.longitude??null,accuracy:fix?.accuracy??null,gpsAt:fix?.gpsAt??null,gpsStatus:fix?'captured':'unavailable'});
   setPhoto(null);setAudio(null);setAnimal('');setNotes('');setFix(null);setGps('Sem posição');await refresh();setTab('records');Alert.alert(t('Salvo no celular','Saved on your phone'),t('Foto e descrição guardadas. Nenhum envio foi realizado.','Photo and description saved. Nothing has been uploaded.'));
  }catch(e){error(e);}finally{lock.current=false;setBusy(false);}
 }
 function submit(){if(!fix)Alert.alert(t('Salvar sem GPS?','Save without GPS?'),t('O registro ficará sem ponto no mapa. Você pode tentar obter a posição antes de salvar.','This sighting will have no map point. You can try getting a location before saving.'),[{text:t('Voltar','Go back'),style:'cancel'},{text:t('Salvar sem GPS','Save without GPS'),onPress:()=>void commit()}]);else void commit();}
 async function backup(){if(lock.current)return;lock.current=true;setBusy(true);try{if(!(await Sharing.isAvailableAsync()))throw new Error(t('Compartilhamento indisponível.','Sharing unavailable.'));await Sharing.shareAsync(await exportBackup(),{mimeType:'application/json',dialogTitle:t('Backup dos avistamentos','Sightings backup')});}catch(e){error(e);}finally{lock.current=false;setBusy(false);}}
 return <SafeAreaView style={s.safe}><View style={s.header}><Text style={s.brand}>BENTO PANTANAL</Text><Text style={s.subtitle}>{t('Caderneta de campo • versão inicial','Field notebook • starter version')}</Text></View>
 <View style={s.tabs}>{(['pt','en'] as const).map(value=><TouchableOpacity accessibilityRole="button" accessibilityState={{selected:lang===value}} key={value} disabled={busy||locating||rec.isRecording} onPress={()=>void chooseLanguage(value)} style={[s.tab,lang===value&&s.active]}><Text style={s.tabText}>{value==='pt'?'Português':'English'}</Text></TouchableOpacity>)}</View>
 <View style={s.tabs}>{[['capture',t('Registrar','Record')],['records',t('Registros','Sightings')]].map(([id,label])=><TouchableOpacity key={id} disabled={busy||rec.isRecording||locating} onPress={()=>setTab(id)} style={[s.tab,tab===id&&s.active]}><Text style={s.tabText}>{label}</Text></TouchableOpacity>)}</View>
 <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
 {tab==='capture'&&<><Text style={s.title}>{t('O que você avistou?','What did you spot?')}</Text><Text style={s.body}>{t('Sem login. Os registros ficam neste aparelho.','No login. Sightings stay on this device.')}</Text>
 <Button label={photo?t('📷 Refazer foto','📷 Retake photo'):t('📷 Fotografar animal','📷 Photograph animal')} onPress={()=>void photograph()} disabled={busy||rec.isRecording||locating}/>
 {photo&&<><Image source={{uri:photo}} style={s.photo}/><Text style={s.body}>{lang==='en' ? ({'Sem posição':'No location','Buscando GPS…':'Getting GPS location…','Posição registrada':'Location recorded'} as Record<string,string>)[gps]??gps : gps}{fix?` • ${t('precisão','accuracy')} ${fix.accuracy===null?t('não informada','unknown'):Math.round(fix.accuracy)+' m'}`:''}</Text>
 <Button label={t('📍 Tentar GPS novamente','📍 Retry GPS')} onPress={()=>void locate()} disabled={busy||locating||rec.isRecording}/>
 <Text style={s.label}>{t('Animal (digite ou grave a voz)','Animal (type or record your voice)')}</Text><TextInput style={s.input} value={animal} onChangeText={setAnimal} placeholder={t('Nome do animal','Animal name')}/>
 <View style={s.chips}>{animals.map(a=><TouchableOpacity key={a} onPress={()=>setAnimal(a)} style={s.chip}><Text>{species(a)}</Text></TouchableOpacity>)}</View>
 <Button label={rec.isRecording?`■ ${t('Parar áudio','Stop recording')} (${Math.round(rec.durationMillis/1000)} s)`:t('🎙 Gravar descrição','🎙 Record description')} onPress={()=>void toggleAudio()} disabled={busy||locating}/>
 {audio&&!rec.isRecording&&<AudioClip uri={audio} label={t("▶ Ouvir áudio","▶ Play audio")}/>}<Text style={s.body}>{t('A voz é guardada como áudio. A transcrição virá na integração.','Your voice is saved as audio. Transcription will be added with server integration.')}</Text>
 <TextInput style={[s.input,{minHeight:90}]} multiline value={notes} onChangeText={setNotes} placeholder={t('Quantidade, comportamento, observações…','Count, behavior, notes…')}/>
 <Button label={t('Salvar avistamento offline','Save sighting offline')} onPress={submit} disabled={busy||locating||rec.isRecording||(!animal.trim()&&!audio)}/></>}
 </>}
 {tab==='records'&&<><Text style={s.title}>{rows.length} {t('avistamentos','sightings')}</Text>{!rows.length&&<Text style={s.body}>{t('Seu primeiro registro começa na aba Registrar.','Create your first sighting in the Record tab.')}</Text>}{rows.map(r=><View style={s.card} key={r.id}><Image source={{uri:r.photo}} style={s.photo}/><Text style={s.title}>{species(r.animal)}</Text><Text style={s.body}>{new Date(r.createdAt).toLocaleString(lang==='en'?'en-US':'pt-BR')}</Text><Text style={s.body}>{r.latitude===null?t('Sem coordenadas','No coordinates'):`${r.latitude.toFixed(6)}, ${r.longitude!.toFixed(6)} • ±${r.accuracy===null?'?':Math.round(r.accuracy)} m`}</Text><Text style={s.body}>{r.notes}</Text>{r.audio&&<AudioClip uri={r.audio} label={t("▶ Ouvir áudio","▶ Play audio")}/>}<Text style={s.pending}>{t('Pendente de sincronização','Pending sync')}</Text></View>)}<Button label={t('Sincronizar com Bento','Sync with Bento')} onPress={()=>setTab('sync')} disabled={busy}/></>}
 {tab==='sync'&&<><Button label={t('Voltar aos registros','Back to sightings')} onPress={()=>setTab('records')}/><Text style={s.title}>{t('Seus registros estão no aparelho','Your sightings are on this device')}</Text><Text style={s.body}>{rows.length} {t('registros aguardam a integração com a Rede de Guias.','sightings await integration with the Guide Network.')}</Text><View style={s.card}><Text style={s.label}>{t('Próxima etapa: conectar Pantanal.Bento','Next step: connect Pantanal.Bento')}</Text><Text style={s.body}>{t('O login será exigido apenas para enviar. Esta base ainda não envia arquivos, não identifica animais por IA e não publica pontos no mapa.','Login will only be required to upload. This starter app does not upload files, identify animals with AI or publish map points yet.')}</Text></View><Button label={t('Exportar backup com fotos e áudios','Export backup with photos and audio')} onPress={()=>void backup()} disabled={busy||!rows.length}/><Text style={s.body}>{t('Guarde o backup em outro local. Desinstalar o app ou limpar seus dados apaga os registros locais. O backup inclui coordenadas e mídia em JSON; arquivos grandes podem demorar.','Keep your backup elsewhere. Uninstalling the app or clearing its data deletes local sightings. The JSON backup includes coordinates and media; large files may take time.')}</Text></>}
 {busy&&<Text style={s.body}>{t('Aguarde…','Please wait…')}</Text>}
 </ScrollView></SafeAreaView>;
}
export default function App(){return <SafeAreaProvider><Main/></SafeAreaProvider>;}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:'#f4f1e8'},header:{backgroundColor:'#153c32',padding:22},brand:{color:'#fff',fontSize:23,fontWeight:'800'},subtitle:{color:'#cce1ce',marginTop:6},tabs:{flexDirection:'row',padding:10,gap:8},tab:{flex:1,padding:13,borderRadius:10,backgroundColor:'#ddd'},active:{backgroundColor:'#d6dfaa'},tabText:{textAlign:'center',fontWeight:'700'},content:{padding:18,paddingBottom:45,gap:14},title:{fontSize:23,fontWeight:'700',color:'#153c32'},body:{fontSize:15,lineHeight:23,color:'#47544b'},label:{fontWeight:'700',fontSize:17,color:'#153c32'},button:{backgroundColor:'#285d43',padding:17,borderRadius:12},buttonText:{color:'#fff',fontSize:17,fontWeight:'700',textAlign:'center'},input:{backgroundColor:'#fff',borderWidth:1,borderColor:'#ccd3c6',borderRadius:10,padding:14,fontSize:17},photo:{width:'100%',height:250,borderRadius:12,resizeMode:'contain',backgroundColor:'#ddd'},chips:{flexDirection:'row',flexWrap:'wrap',gap:8},chip:{backgroundColor:'#e0e6d3',borderRadius:18,padding:10},card:{padding:15,backgroundColor:'#fff',borderRadius:15,gap:10},pending:{fontWeight:'700',color:'#8c601a'}});
