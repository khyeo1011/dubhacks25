import React, { useState, useEffect } from 'react';
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
  Box
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


  useEffect(() => {
    if (BrowserSTT.isSupported()) {
      const instance = new BrowserSTT({ lang: 'en-US', interim: true, continuous: true });
      setStt(instance);
    } else {
      console.warn('Speech recognition not supported in this browser.');
    }
  }, []);

const handleVoiceToggle = () => {
  if (!stt) {
    alert('Speech recognition not supported.');
    return;
  }

  if (!isListening) {
    // START listening
    setLoading(true);
    setIsListening(true);

    stt.start({
      onPartial: (text) => {
        const combined = `${buffer} ${text}`.trim();
        setQuery(combined);
        setValue('query', combined);
      },
      onFinal: (text) => {
        setQuery(text);
        setValue('query', text);
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


  const handleQueryChange = (e) => {
    setQuery(e.target.value);
    setValue('query', e.target.value);
  };

  const handleResponseChange = (e) => {
    setResponseText(e.target.value);
  }

  const doQuery = async (data) => {
    console.log('Query submitted:', query);
    const result = await invoke('sendData', { query });
    console.log('Response from sendData:', result);
    setResponseText(result); // update response text
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
            <Button type="submit" appearance="primary">
              Submit
            </Button>
          </ButtonGroup>
        </FormFooter>
      </Form>

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
