import React, { useState, useEffect, useRef } from 'react';
import ForgeReconciler, {
  Button,
  ButtonGroup,
  Form,
  FormHeader,
  FormFooter,
  Text,
  Textfield,
  useForm,
  TextArea,
  Link,
  Label,
  Toggle
} from '@forge/react';
import { invoke } from '@forge/bridge';
import { BrowserSTT } from './stt';


/* ---------- Subcomponents ---------- */

const VoiceInput = ({ loading, isListening }) => (
  <Button appearance={isListening ? 'danger' : 'default'}>
    {isListening ? 'Stop Listening' : (loading ? 'Listening...' : 'Voice Input')}
  </Button>
);

const SubmitButton = () => (
  <Button type="submit" appearance="primary">
    Submit
  </Button>
);

const InputButtons = ({ onVoiceInput, loading, isListening }) => (
  <ButtonGroup>
    <VoiceInput onClick={onVoiceInput} loading={loading} isListening={isListening} />
    <SubmitButton />
  </ButtonGroup>
);

/* ---------- Main App ---------- */

const App = () => {
  const { handleSubmit, register, setValue } = useForm();
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(''); // control the text field value
  const [responseText, setResponseText] = useState(''); // state for response text
  const [isListening, setIsListening] = useState(false);
  const [stt, setStt] = useState(null);
  const [ttsEnabled, setTtsEnabled] = useState(false);

  useEffect(() => {
    if (BrowserSTT.isSupported()) {
      const instance = new BrowserSTT({ lang: 'en-US', interim: true, continuous: true });
      setStt(instance);
    } else {
      console.warn('Speech recognition not supported in this browser.');
    }
  }, []);

  const audioCtxRef = useRef(null);

  const unlockAudio = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      // resume returns a Promise
      audioCtxRef.current.resume().then(() => {
        console.log('AudioContext resumed (user gesture). state=', audioCtxRef.current.state);
      }).catch(err => {
        console.warn('AudioContext resume failed:', err);
      });

      return true;
    } catch (err) {
      console.warn('unlockAudio error', err);
      return false;
    }
  };

  const handleVoiceToggle = () => {
    if (!stt) {
      alert('Speech recognition not supported.');
      return;
    }

    if (!isListening) {
      // START listening
      setLoading(true);
      setIsListening(true);

      let buffer = query; // capture current query

      stt.start({
        onPartial: (text) => {
          const combined = `${buffer} ${text}`.trim();
          setQuery(combined);
          setValue('query', combined);
        },
        onFinal: (text) => {
          buffer = `${buffer} ${text}`.trim();
          setValue('query', buffer);
          setLoading(false);
          setIsListening(false);
        },
        onError: (e) => {
          console.error('STT error:', e);
          setLoading(false);
          setIsListening(false);
        },
      });
    } else {
      // STOP gracefully
      try {
        stt._rec.onend = () => {
          console.log('Recognition stopped by user.');
          setIsListening(false);
          setLoading(false);
        };
        setTimeout(() => stt.stop(), 200);
      } catch (err) {
        console.error('Error stopping STT:', err);
        setIsListening(false);
        setLoading(false);
      }
    }
  };

  const handleAudioToggle = async (e) => {
    setTtsEnabled(e.target.checked);
    console.log('TTS Enabled:', e.target.checked);
  };



  const handleQueryChange = (e) => {
    setQuery(e.target.value);
    setValue('query', e.target.value);
  };


  const doQuery = async (data) => {
    unlockAudio();
    try {
      console.log('Query submitted:', query);

      // Send query to backend
      const result = await invoke('sendData', { query });
      console.log('Response from sendData:', result);
      setResponseText(result);

      // Optional text-to-speech
      if (ttsEnabled && result) {
        console.log('Requesting TTS for response...');
        const audioBase64 = await invoke('getTTS', { text: result });
        console.log('Received TTS audio data');

        const audioBytes = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
        const audioBlob = new Blob([audioBytes], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);

        // unlock audio before playback
        await unlockAudio();

        // play via existing <audio> element (safer in Forge)
        if (audioCtxRef.current) {
          audioCtxRef.current.src = audioUrl;
          audioCtxRef.current.play().then(() => {
            console.log('Audio playback started.');
          }).catch(err => {
            console.error('Audio playback failed:', err);
          });
        }
      }

    } catch (err) {
      console.error('Error in doQuery:', err);
    }
  };


  return (
    <>
      <Form onSubmit={handleSubmit(doQuery)}>
        <FormHeader title="Smart Query">
          <Text>Use voice input or type your query below:</Text>
        </FormHeader>

        <Textfield
          {...register('query')}
          value={query}
          onChange={handleQueryChange}
          placeholder="Your query will appear here..."
        />

        <FormFooter>
          <ButtonGroup>
            <Button onClick={handleVoiceToggle} appearance={isListening ? 'danger' : 'default'}>
              {isListening ? 'Stop Listening' : (loading ? 'Listening...' : 'Voice Input')}
            </Button>
            <Button type="submit" appearance="primary" onClick={unlockAudio}>
              Submit
            </Button>
          </ButtonGroup>
        </FormFooter>
      </Form>
      <Toggle id="TTS" onChange={handleAudioToggle} isChecked={ttsEnabled}></Toggle>
      <Label laberFor="TTS">Enable Text-to-Speech</Label>
      <Text>{responseText}</Text>
    </>
  );
};

/* ---------- Render ---------- */

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
