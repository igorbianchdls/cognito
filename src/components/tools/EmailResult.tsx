'use client';

interface EmailResultProps {
  success: boolean;
  emailId?: string;
  recipient: string;
  subject: string;
  bodyLength: number;
  priority?: string;
  attachmentCount?: number;
  timestamp: string;
  message: string;
  note?: string;
  error?: string;
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'high':
      return 'text-red-600 bg-red-100';
    case 'normal':
      return 'text-blue-600 bg-blue-100';
    case 'low':
      return 'text-gray-600 bg-gray-100';
    default:
      return 'text-blue-600 bg-blue-100';
  }
}

function getPriorityIcon(priority: string) {
  switch (priority) {
    case 'high':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    case 'normal':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case 'low':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12l-4-4-4 4m8 6l-4-4-4 4" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
  }
}

export default function EmailResult({
  success,
  emailId,
  recipient,
  subject,
  bodyLength,
  priority = 'normal',
  attachmentCount = 0,
  timestamp,
  message,
  note,
  error
}: EmailResultProps) {

  if (!success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-red-800">Erro ao enviar email</h3>
        </div>
        <p className="text-red-700 text-sm">{error || 'Erro desconhecido'}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3 className="font-semibold text-gray-900">📧 Email Enviado</h3>
        </div>

        {priority && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(priority)}`}>
            {getPriorityIcon(priority)}
            <span>{priority}</span>
          </div>
        )}
      </div>

      {/* Email Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div>
            <label className="text-sm font-medium text-gray-600">Para:</label>
            <p className="text-sm text-gray-900">{recipient}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Assunto:</label>
            <p className="text-sm text-gray-900">{subject}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <label className="text-sm font-medium text-gray-600">Tamanho do conteúdo:</label>
            <p className="text-sm text-gray-900">{bodyLength.toLocaleString()} caracteres</p>
          </div>

          {attachmentCount > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-600">Anexos:</label>
              <p className="text-sm text-gray-900">{attachmentCount} arquivo{attachmentCount !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Message */}
      <div className="bg-green-50 border border-green-200 rounded p-3">
        <p className="text-green-800 text-sm">{message}</p>
      </div>

      {/* Placeholder Note */}
      {note && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-yellow-800 text-sm font-medium">Nota:</p>
          </div>
          <p className="text-yellow-700 text-sm mt-1">{note}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
        <span>ID do Email: {emailId}</span>
        <span>Enviado em: {new Date(timestamp).toLocaleString('pt-BR')}</span>
      </div>
    </div>
  );
}