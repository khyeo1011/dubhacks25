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
  Toggle,
  AdfRenderer,
  LoadingButton
} from '@forge/react';
import { markdownToAdf } from 'marklassian';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
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

  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playBase64Audio = async (base64Audio) => {
    try {
      // Convert base64 to blob URL
      const audioBytes = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
      const blob = new Blob([audioBytes.buffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);

      // Create new audio element
      const audio = new Audio(url);
      
      // Clean up previous audio if exists
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }

      // Set up event handlers
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };

      // Play audio
      audioRef.current = audio;
      setIsPlaying(true);
      await audio.play();

      console.log('Audio playback started');
    } catch (err) {
      console.error('Error playing audio:', err);
      setIsPlaying(false);
    }
  };


  const handleVoiceToggle = () => {
    if (!stt) {
      alert('Speech recognition not supported.');
      return;
    }

    if (!isListening) {
      // START listening
      setIsVoiceLoading(true);
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
          setValue('query', text);
          setIsVoiceLoading(false);
          setIsListening(false);
        },
        onError: (e) => {
          console.error('STT error:', e);
          setIsVoiceLoading(false);
          setIsListening(false);
        },
      });
    } else {
      // STOP gracefully
      try {
        stt._rec.onend = () => {
          console.log('Recognition stopped by user.');
          setIsListening(false);
          setIsVoiceLoading(false);
        };
        setTimeout(() => stt.stop(), 200);
      } catch (err) {
        console.error('Error stopping STT:', err);
        setIsListening(false);
        setIsVoiceLoading(false);
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
    try {
      setIsSubmitting(true);
      console.log('Query submitted:', query);

      // Call backend
      const result = await invoke('sendData', { query });
      console.log('Response from sendData:', result);
      setResponseText(markdownToAdf(result));
      console.log('Converted ADF:', responseText);
      
      // Optional TTS
      if (ttsEnabled && responseText) {
        console.log('Fetching TTS audio... ', result);

        // Request TTS data
        const audioBase64 = await invoke('getTTS', { text: result });

        // Play TTS audio
        await playBase64Audio(audioBase64);
      }
    } catch (err) {
      console.error('Error in doQuery:', err);
    } finally {
      setIsSubmitting(false);
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
            <Button 
              onClick={handleVoiceToggle} 
              appearance={isListening ? 'danger' : 'default'}
              isDisabled={isSubmitting}
            >
              {isListening ? 'Stop Listening' : 'Voice Input'}
            </Button>
            <LoadingButton 
              type="submit" 
              appearance="primary" 
              isLoading={isSubmitting}
              isDisabled={isSubmitting}
            >
              Submit
            </LoadingButton>
          </ButtonGroup>
        </FormFooter>
      </Form>
      {responseText && (
        <AdfRenderer document={responseText} />
      )}
    </>
  );
};

/* ---------- Render ---------- */

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
