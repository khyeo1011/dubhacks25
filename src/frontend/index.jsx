import React, { useState } from 'react';
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

/* ---------- Subcomponents ---------- */

const VoiceInput = ({ onClick, loading }) => (
  <Button onClick={onClick} isDisabled={loading}>
    {loading ? 'Listening...' : 'Voice Input'}
  </Button>
);

const SubmitButton = () => (
  <Button type="submit" appearance="primary">
    Submit
  </Button>
);

const InputButtons = ({ onVoiceInput, loading }) => (
  <ButtonGroup>
    <VoiceInput onClick={onVoiceInput} loading={loading} />
    <SubmitButton />
  </ButtonGroup>
);

/* ---------- Main App ---------- */

const App = () => {
  const { handleSubmit, register, setValue } = useForm();
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(''); // control the text field value
  const [responseText, setResponseText] = useState(''); // state for response text

  const getVoiceInput = async () => {
    try {
      setLoading(true);
      console.log('Invoking getText...');
      const result = await invoke('getText', { example: 'my-invoke-variable' });

      if (result && typeof result === 'string' && result.trim() !== '') {
        setQuery(result);
        setValue('query', result); // keep react-hook-form in sync
      } else {
        console.warn('No text returned from getText');
      }
    } catch (error) {
      console.error('Error invoking getText:', error);
    } finally {
      setLoading(false);
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
        <InputButtons onVoiceInput={getVoiceInput} loading={loading} />
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
