import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Button, ButtonGroup, Text, Textfield } from '@forge/react';
import { invoke } from '@forge/bridge';

const App = () => {
  const [input, setInput] = useState(null);

  const changeText = async () => {
    
  };

  const InputButtons = () => (
    <ButtonGroup>
      <VoiceInput />
      <SubmitButton />
    </ButtonGroup>
  );
  
  const getVoiceInput = async () => {
    const result = await invoke('getText', { example: 'my-invoke-variable' });
    setInput(result);
  };

  const VoiceInput = () => (
    <Button onClick={getVoiceInput}>Voice Input</Button>
  );
  
  const SubmitButton = () => (
    <Button appearance='primary' onClick={changeText}>Submit</Button>
  );

  return (
    <>
      <Textfield id = "inputfield" placeholder={input}></Textfield>
      <InputButtons/>
    </>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
