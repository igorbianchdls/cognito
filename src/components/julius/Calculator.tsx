'use client';

import { useState } from 'react';

interface CalculatorProps {
  expression?: string;
  result?: number;
}

export default function Calculator({ expression = '', result }: CalculatorProps) {
  const [display, setDisplay] = useState(expression || result?.toString() || '0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const inputOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);
      
      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForNewValue(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string) => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '×':
        return firstValue * secondValue;
      case '÷':
        return firstValue / secondValue;
      case '=':
        return secondValue;
      default:
        return secondValue;
    }
  };

  const performCalculation = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForNewValue(true);
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
  };

  const Button = ({ onClick, className = '', children }: {
    onClick: () => void;
    className?: string;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={`h-12 text-lg font-medium rounded-lg transition-colors ${className}`}
    >
      {children}
    </button>
  );

  return (
    <div className="bg-gray-900 rounded-lg p-4 max-w-xs mx-auto shadow-lg">
      <div className="bg-black rounded-lg p-4 mb-4">
        <div className="text-right text-white text-2xl font-mono min-h-[2rem] flex items-center justify-end">
          {display}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Button
          onClick={clear}
          className="col-span-2 bg-gray-600 hover:bg-gray-700 text-white"
        >
          AC
        </Button>
        <Button
          onClick={() => {}}
          className="bg-gray-600 hover:bg-gray-700 text-white"
        >
          ±
        </Button>
        <Button
          onClick={() => inputOperation('÷')}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          ÷
        </Button>

        <Button
          onClick={() => inputNumber('7')}
          className="bg-gray-700 hover:bg-gray-600 text-white"
        >
          7
        </Button>
        <Button
          onClick={() => inputNumber('8')}
          className="bg-gray-700 hover:bg-gray-600 text-white"
        >
          8
        </Button>
        <Button
          onClick={() => inputNumber('9')}
          className="bg-gray-700 hover:bg-gray-600 text-white"
        >
          9
        </Button>
        <Button
          onClick={() => inputOperation('×')}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          ×
        </Button>

        <Button
          onClick={() => inputNumber('4')}
          className="bg-gray-700 hover:bg-gray-600 text-white"
        >
          4
        </Button>
        <Button
          onClick={() => inputNumber('5')}
          className="bg-gray-700 hover:bg-gray-600 text-white"
        >
          5
        </Button>
        <Button
          onClick={() => inputNumber('6')}
          className="bg-gray-700 hover:bg-gray-600 text-white"
        >
          6
        </Button>
        <Button
          onClick={() => inputOperation('-')}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          -
        </Button>

        <Button
          onClick={() => inputNumber('1')}
          className="bg-gray-700 hover:bg-gray-600 text-white"
        >
          1
        </Button>
        <Button
          onClick={() => inputNumber('2')}
          className="bg-gray-700 hover:bg-gray-600 text-white"
        >
          2
        </Button>
        <Button
          onClick={() => inputNumber('3')}
          className="bg-gray-700 hover:bg-gray-600 text-white"
        >
          3
        </Button>
        <Button
          onClick={() => inputOperation('+')}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          +
        </Button>

        <Button
          onClick={() => inputNumber('0')}
          className="col-span-2 bg-gray-700 hover:bg-gray-600 text-white"
        >
          0
        </Button>
        <Button
          onClick={() => inputNumber('.')}
          className="bg-gray-700 hover:bg-gray-600 text-white"
        >
          .
        </Button>
        <Button
          onClick={performCalculation}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          =
        </Button>
      </div>
    </div>
  );
}