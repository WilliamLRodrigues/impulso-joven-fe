import React, { useEffect, useMemo, useState } from 'react';
import Card, { CardHeader } from './Card';
import { MIN_APPROVAL_SCORE, getTrainingModule } from '../modules/treinamento';

const TrainingModal = ({
  isOpen,
  moduleKey,
  onClose,
  onComplete,
  successActionLabel = 'Concluir Treinamento',
}) => {
  const [trainingPhase, setTrainingPhase] = useState('content');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(null);
  const [answerFeedback, setAnswerFeedback] = useState('');
  const [quizResult, setQuizResult] = useState(null);
  const [trainingAlert, setTrainingAlert] = useState(null);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);

  const trainingModule = useMemo(() => {
    if (!moduleKey) {
      return null;
    }
    return getTrainingModule(moduleKey);
  }, [moduleKey]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setTrainingPhase('content');
    setCurrentQuestionIndex(0);
    setSelectedOptionIndex(null);
    setAnswerSubmitted(false);
    setQuizAnswers([]);
    setLastAnswerCorrect(null);
    setAnswerFeedback('');
    setQuizResult(null);
    setTrainingAlert(null);
    if (trainingModule?.questions?.length) {
      const shuffled = trainingModule.questions.map((question) => {
        const indexed = question.options.map((option, index) => ({ option, index }));
        for (let i = indexed.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
        }
        const newCorrectIndex = indexed.findIndex(
          (item) => item.index === question.correctOptionIndex
        );
        return {
          ...question,
          options: indexed.map((item) => item.option),
          correctOptionIndex: newCorrectIndex,
        };
      });
      setShuffledQuestions(shuffled);
    } else {
      setShuffledQuestions([]);
    }
  }, [isOpen, moduleKey]);

  if (!isOpen) {
    return null;
  }

  if (!trainingModule) {
    return (
      <div style={overlayStyle}>
        <Card style={{ maxWidth: '480px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
          <CardHeader>Treinamento</CardHeader>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            fontSize: '14px',
            color: '#424242'
          }}>
            <div style={{
              background: '#FFF3CD',
              border: '1px solid #FFEEBA',
              borderRadius: '8px',
              padding: '12px'
            }}>
              Não encontramos o conteúdo deste treinamento. Informe o suporte para liberar o acesso corretamente.
            </div>
            <button
              className="btn btn-secondary"
              onClick={onClose}
              style={{ alignSelf: 'flex-end' }}
            >
              Fechar
            </button>
          </div>
        </Card>
      </div>
    );
  }

  const handleStartTrainingQuiz = () => {
    setTrainingPhase('quiz');
    setTrainingAlert(null);
  };

  const handleSubmitTrainingAnswer = () => {
    if (selectedOptionIndex === null) {
      setTrainingAlert({ type: 'warning', message: 'Selecione uma alternativa para confirmar a resposta.' });
      return;
    }

    const questionList = shuffledQuestions.length ? shuffledQuestions : trainingModule.questions;
    const question = questionList[currentQuestionIndex];
    const isCorrect = question.correctOptionIndex === selectedOptionIndex;
    const updatedAnswers = [...quizAnswers];
    updatedAnswers[currentQuestionIndex] = isCorrect;
    setQuizAnswers(updatedAnswers);
    setLastAnswerCorrect(isCorrect);
    setAnswerSubmitted(true);
    setTrainingAlert(null);
    setAnswerFeedback(
      isCorrect
        ? 'Resposta correta! Você está no caminho certo para atender os clientes com excelência.'
        : 'Resposta incorreta. Revise com atenção o conteúdo e aplique as boas práticas descritas.'
    );

    if (currentQuestionIndex === questionList.length - 1) {
      const score = updatedAnswers.filter(Boolean).length;
      setQuizResult({
        score,
        total: questionList.length,
        passed: score >= MIN_APPROVAL_SCORE,
      });
    }
  };

  const handleAdvanceTrainingQuestion = () => {
    if (!answerSubmitted) {
      setTrainingAlert({ type: 'warning', message: 'Confirme a resposta antes de avançar para a próxima questão.' });
      return;
    }

    const questionList = shuffledQuestions.length ? shuffledQuestions : trainingModule.questions;
    if (currentQuestionIndex === questionList.length - 1) {
      setAnswerFeedback('');
      setTrainingAlert(null);
      setTrainingPhase('result');
      return;
    }

    setCurrentQuestionIndex((prev) => prev + 1);
    setSelectedOptionIndex(null);
    setAnswerSubmitted(false);
    setLastAnswerCorrect(null);
    setAnswerFeedback('');
    setTrainingAlert(null);
  };

  const handleRetryTraining = () => {
    setTrainingPhase('content');
    setCurrentQuestionIndex(0);
    setSelectedOptionIndex(null);
    setAnswerSubmitted(false);
    setQuizAnswers([]);
    setLastAnswerCorrect(null);
    setAnswerFeedback('');
    setQuizResult(null);
    setTrainingAlert(null);
  };

  const handleCompleteTraining = async () => {
    if (!quizResult?.passed) {
      return;
    }

    if (onComplete) {
      await onComplete(moduleKey, quizResult);
    }
  };

  const renderAlert = () => {
    if (!trainingAlert) {
      return null;
    }
    const isError = trainingAlert.type === 'error';
    return (
      <div style={{
        background: isError ? '#FDECEA' : '#FFF3CD',
        border: isError ? '1px solid #F5C6CB' : '1px solid #FFEEBA',
        borderRadius: '8px',
        padding: '12px',
        color: isError ? '#A94442' : '#856404',
        fontSize: '13px'
      }}>
        {trainingAlert.message}
      </div>
    );
  };

  return (
    <div style={overlayStyle}>
      <Card style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <CardHeader>🎓 Treinamento Obrigatório</CardHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            background: '#E3F2FD',
            border: '1px solid #64B5F6',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '13px',
            color: '#0D47A1'
          }}>
            <strong>{trainingModule.label}</strong> • {trainingModule.summary}
          </div>

          {trainingPhase === 'content' && (
            <>
              <div style={{ fontSize: '14px', lineHeight: '1.7', color: '#424242' }}>
                Leia com atenção as orientações abaixo. Elas combinam habilidades técnicas e um atendimento gentil para garantir uma experiência excelente ao cliente.
              </div>
              <ul style={{ margin: '0', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {trainingModule.content.map((item, index) => (
                  <li key={index} style={{ fontSize: '14px', color: '#37474F' }}>
                    {item}
                  </li>
                ))}
              </ul>
              <div style={{ fontSize: '12px', color: '#616161' }}>
                💡 Dica: mantenha sempre a cordialidade, comunique-se com clareza e confirme com o cliente antes de qualquer mudança.
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, minWidth: '140px' }}
                  onClick={onClose}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 2, minWidth: '160px' }}
                  onClick={handleStartTrainingQuiz}
                >
                  Iniciar Questionário
                </button>
              </div>
            </>
          )}

          {trainingPhase === 'quiz' && (
            <>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '13px',
                color: '#424242'
              }}>
                <strong>{`Questão ${currentQuestionIndex + 1} de ${(shuffledQuestions.length ? shuffledQuestions : trainingModule.questions).length}`}</strong>
                <span>Acertos até agora: {quizAnswers.filter(Boolean).length} • Mínimo para aprovação: {MIN_APPROVAL_SCORE}</span>
              </div>
              <div style={{
                background: '#F5F5F5',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid #E0E0E0'
              }}>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#1F2933', marginBottom: '12px' }}>
                  {(shuffledQuestions.length ? shuffledQuestions : trainingModule.questions)[currentQuestionIndex].question}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(shuffledQuestions.length ? shuffledQuestions : trainingModule.questions)[currentQuestionIndex].options.map((option, optionIndex) => {
                    const isSelected = selectedOptionIndex === optionIndex;
                    return (
                      <label
                        key={optionIndex}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px',
                          borderRadius: '6px',
                          border: isSelected ? '2px solid #1976D2' : '1px solid #CFD8DC',
                          background: isSelected ? '#E3F2FD' : 'white',
                          cursor: answerSubmitted ? 'default' : 'pointer'
                        }}
                      >
                        <input
                          type="radio"
                          name="trainingOption"
                          value={optionIndex}
                          checked={isSelected}
                          disabled={answerSubmitted}
                          onChange={() => setSelectedOptionIndex(optionIndex)}
                        />
                        <span style={{ fontSize: '14px', color: '#37474F' }}>{option}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {answerFeedback && (
                <div style={{
                  background: lastAnswerCorrect ? '#E8F5E9' : '#FFEBEE',
                  border: lastAnswerCorrect ? '1px solid #66BB6A' : '1px solid #EF5350',
                  borderRadius: '8px',
                  padding: '12px',
                  color: lastAnswerCorrect ? '#1B5E20' : '#B71C1C',
                  fontSize: '13px'
                }}>
                  {answerFeedback}
                </div>
              )}

              {renderAlert()}

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, minWidth: '140px' }}
                  onClick={onClose}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 2, minWidth: '160px' }}
                  onClick={answerSubmitted ? handleAdvanceTrainingQuestion : handleSubmitTrainingAnswer}
                  disabled={!answerSubmitted && selectedOptionIndex === null}
                >
                  {answerSubmitted
                    ? (currentQuestionIndex === (shuffledQuestions.length ? shuffledQuestions : trainingModule.questions).length - 1
                      ? 'Ver Resultado'
                      : 'Próxima Questão')
                    : 'Confirmar Resposta'}
                </button>
              </div>
            </>
          )}

          {trainingPhase === 'result' && quizResult && (
            <>
              <div style={{
                background: quizResult.passed ? '#E8F5E9' : '#FFEBEE',
                border: quizResult.passed ? '1px solid #66BB6A' : '1px solid #EF9A9A',
                borderRadius: '8px',
                padding: '16px',
                fontSize: '14px',
                color: quizResult.passed ? '#1B5E20' : '#B71C1C',
                lineHeight: '1.7'
              }}>
                <strong>{quizResult.passed ? 'Parabéns!' : 'Você está quase lá!'}</strong><br />
                Você acertou {quizResult.score} de {quizResult.total} perguntas. É preciso acertar pelo menos {MIN_APPROVAL_SCORE} para liberar a tarefa.
              </div>

              {!quizResult.passed && (
                <div style={{ fontSize: '13px', color: '#424242' }}>
                  Reveja as orientações com atenção, mantenha o foco no cuidado com o cliente e tente novamente quando estiver pronto.
                </div>
              )}

              {renderAlert()}

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, minWidth: '140px' }}
                  onClick={onClose}
                >
                  Fechar
                </button>
                {quizResult.passed ? (
                  <button
                    className="btn btn-primary"
                    style={{ flex: 2, minWidth: '160px' }}
                    onClick={handleCompleteTraining}
                  >
                    {successActionLabel}
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    style={{ flex: 2, minWidth: '160px' }}
                    onClick={handleRetryTraining}
                  >
                    Refazer Treinamento
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.65)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1100,
  padding: '20px',
  overflowY: 'auto'
};

export default TrainingModal;
