/**
 * LoggingPhase - Handle console output and logging
 * 
 * Function copied exactly from CodeEditor.tsx lines 47-52
 */

export class LoggingPhase {

  /**
   * Log function for output (copied from CodeEditor line 47-52)
   */
  static log(setOutput: React.Dispatch<React.SetStateAction<string[]>>, ...args: unknown[]) {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ')
    setOutput(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }
}