import React, { useState, useEffect, useRef, useCallback } from 'react';

const STEPS = [
  {
    targetId: 'tutorial-bingo-card',
    title: 'Sua Cartela Lucky',
    text: 'Esta é a sua cartela. Complete linhas horizontais, verticais ou diagonais de números sorteados para completar o BINGO e vencer a fase!',
    position: 'bottom', // placing tooltip below the highlight
  },
  {
    targetId: 'tutorial-spin-button',
    title: 'Gire e Sorteie',
    text: 'Toque no botão SPIN para girar e sortear 5 números novos. Cada giro consome 1 bola da sua pilha.',
    position: 'top', // placing tooltip above the highlight
  },
  {
    targetId: 'tutorial-bucket-row',
    title: 'Os Canos do Tabuleiro',
    text: 'Os 5 números sorteados caem do topo e aparecem nestes 5 canos, cada um correspondendo a uma coluna (L-U-C-K-Y).',
    position: 'top',
  },
  {
    targetId: 'tutorial-bucket-row',
    title: 'Toque para Disparar!',
    text: 'Quando um número for útil para sua cartela, ele ficará DOURADO. Toque nesse cano para soltar a bola do Plinko e tentar acertar os pinos para pontuar!',
    position: 'top',
  },
  {
    targetId: null, // Full center overlay
    title: 'Poderes Especiais',
    text: 'Você também pode usar a Bola de Fogo para marcar uma área maior ou o Número Mágico para forçar a marcação de qualquer número na sua cartela!',
    position: 'center',
  }
];

export default function Tutorial({ onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState(null);
  const resizeTimeoutRef = useRef(null);

  const updateHighlight = useCallback(() => {
    const step = STEPS[currentStep];
    if (!step || !step.targetId) {
      setHighlightRect(null);
      return;
    }
    const element = document.getElementById(step.targetId);
    if (element) {
      const rect = element.getBoundingClientRect();
      setHighlightRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    } else {
      setHighlightRect(null);
    }
  }, [currentStep]);

  useEffect(() => {
    // Wait for the DOM to settle and render
    const timer = setTimeout(() => {
      updateHighlight();
    }, 150);

    const handleResize = () => {
      clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = setTimeout(() => {
        updateHighlight();
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [currentStep, updateHighlight]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const activeStep = STEPS[currentStep];

  // Dynamic style for the tooltip box
  const getTooltipStyle = () => {
    if (!highlightRect || activeStep.position === 'center') {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '340px',
      };
    }

    const gap = 15;
    if (activeStep.position === 'bottom') {
      return {
        top: `${highlightRect.top + highlightRect.height + gap}px`,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: '340px',
      };
    }

    // Default 'top'
    return {
      bottom: `${window.innerHeight - highlightRect.top + gap}px`,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90%',
      maxWidth: '340px',
    };
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-auto select-none overflow-hidden transition-all duration-300">
      {/* Dark Backdrop Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

      {/* Spotlight cutout */}
      {highlightRect && (
        <div
          className="absolute border-[3px] border-yellow-400 rounded-xl pointer-events-none transition-all duration-300"
          style={{
            top: highlightRect.top - 4,
            left: highlightRect.left - 4,
            width: highlightRect.width + 8,
            height: highlightRect.height + 8,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
            zIndex: 101,
          }}
        />
      )}

      {/* Tooltip Card */}
      <div
        className="absolute bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 z-[102] transition-all duration-300 text-white animate-scale-up"
        style={getTooltipStyle()}
      >
        {/* Step Indicator */}
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-yellow-400 tracking-wider uppercase">
            TUTORIAL ({currentStep + 1}/{STEPS.length})
          </span>
          <button
            onClick={handleSkip}
            className="text-xs text-slate-400 hover:text-white transition-colors py-1 px-2 hover:bg-slate-800/50 rounded-lg"
          >
            Pular Tutorial
          </button>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white tracking-wide">
          {activeStep.title}
        </h3>

        {/* Text */}
        <p className="text-sm text-slate-300 leading-relaxed">
          {activeStep.text}
        </p>

        {/* Footer Actions */}
        <div className="flex justify-end mt-2">
          <button
            onClick={handleNext}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-yellow-500/20 active:scale-95 transition-all"
          >
            {currentStep === STEPS.length - 1 ? 'Começar a Jogar!' : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  );
}
