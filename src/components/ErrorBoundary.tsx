import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  {children: React.ReactNode},
  ErrorBoundaryState
> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = {hasError: false, errorMessage: ''};
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'حدث خطأ غير متوقع في التطبيق',
    };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F2F6F1] p-6" dir="rtl">
          <div className="max-w-md w-full bg-white border border-[#C6D1C3] rounded-2xl p-6 text-center space-y-4 shadow-sm">
            <h2 className="font-display font-black text-lg text-[#134435]">
              حدث خطأ أثناء عرض الصفحة
            </h2>
            <p className="font-body text-xs text-[#354E44] break-words">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={() => this.setState({hasError: false, errorMessage: ''})}
              className="px-5 py-2.5 rounded-xl bg-[#134435] text-white font-display font-bold text-sm hover:bg-[#0B2D22] transition-colors cursor-pointer"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
