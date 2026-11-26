import React, {useEffect, useRef, useState} from 'react';
import type {User} from 'firebase/auth';
import {
  CheckCircle2,
  ExternalLink,
  FolderPlus,
  FolderUp,
  LogOut,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  clearDriveAccessToken,
  getDriveAccessToken,
  googleDriveSignIn,
  initDriveAuth,
  logoutDriveAuth,
} from '../services/googleDriveAuth';
import {
  listBundleProjectFiles,
  uploadProjectToGoogleDriveFolder,
  type DriveUploadProgress,
  type DriveUploadResult,
} from '../services/googleDriveUpload';

interface DriveUploadModalProps {
  open: boolean;
  onClose: () => void;
}

export const DriveUploadModal: React.FC<DriveUploadModalProps> = ({open, onClose}) => {
  const [needsAuth, setNeedsAuth] = useState<boolean>(() => !getDriveAccessToken());
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => getDriveAccessToken());
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [folderName, setFolderName] = useState('Josour-Website-Project');
  const [includeZipArchive, setIncludeZipArchive] = useState(true);
  const [projectFiles, setProjectFiles] = useState<string[]>([]);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<DriveUploadProgress | null>(null);
  const [result, setResult] = useState<DriveUploadResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const unsub = initDriveAuth(
      (authedUser, token) => {
        setUser(authedUser);
        setAccessToken(token);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setNeedsAuth(true);
      },
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!open) return;
    listBundleProjectFiles()
      .then((files) => setProjectFiles(files))
      .catch(() => {});
  }, [open]);

  if (!open) return null;

  const handleLogin = async () => {
    setErrorMsg(null);
    setIsLoggingIn(true);
    try {
      const authRes = await googleDriveSignIn();
      setUser(authRes.user);
      setAccessToken(authRes.accessToken);
      setNeedsAuth(false);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'تعذر تسجيل الدخول عبر Google. حاول مرة أخرى.',
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutDriveAuth();
    setUser(null);
    setAccessToken(null);
    setNeedsAuth(true);
    setResult(null);
    setProgress(null);
  };

  const handleConfirmUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = accessToken || getDriveAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setUploading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const uploadRes = await uploadProjectToGoogleDriveFolder({
        accessToken: token,
        folderName,
        includeZipArchive,
        onProgress: setProgress,
        signal: ctrl.signal,
      });
      setResult(uploadRes);
    } catch (err) {
      if (err instanceof Error && err.message === 'AUTH_EXPIRED') {
        clearDriveAccessToken();
        setAccessToken(null);
        setNeedsAuth(true);
        setErrorMsg('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى للمتابعة.');
      } else if (!ctrl.signal.aborted) {
        setErrorMsg(err instanceof Error ? err.message : 'حدث خطأ أثناء رفع الملفات إلى Google Drive');
      }
    } finally {
      setUploading(false);
    }
  };

  const pct =
    progress && progress.total > 0 ? Math.round((progress.uploaded / progress.total) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2D22]/80 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-label="رفع ملفات المشروع إلى Google Drive"
    >
      <div className="bg-[#FAFBF7] border border-[#C6D1C3] rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="bg-[#134435] text-white px-5 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <FolderUp className="w-5 h-5 text-[#F2CE74] shrink-0" />
            <div className="min-w-0">
              <h3 className="font-display font-bold text-base truncate">
                رفع ملفات المشروع إلى Google Drive
              </h3>
              {user && !needsAuth && (
                <p className="font-body text-xs text-[#F2CE74] truncate">{user.email}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user && !needsAuth && !uploading && (
              <button
                type="button"
                onClick={handleLogout}
                className="h-8 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-display font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>تبديل الحساب</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (uploading) abortRef.current?.abort();
                onClose();
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/15 cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {needsAuth ? (
            <div className="rounded-2xl bg-white border border-[#D4DDD2] p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EAF1EA] text-[#134435] flex items-center justify-center mx-auto">
                <FolderPlus className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-display font-extrabold text-base text-[#11261E]">
                  اربط حسابك في Google Drive للرفع المباشر
                </h4>
                <p className="font-body text-xs text-[#354E44] leading-relaxed">
                  سيقوم التطبيق — بإذنك — بإنشاء مجلد جديد على Google Drive ورفع جميع ملفات
                  المشروع ({projectFiles.length || 29} ملفاً) بداخله مع الحفاظ على ترتيب المجلدات.
                </p>
              </div>

              <div className="flex justify-center pt-1" dir="ltr">
                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="gsi-material-button"
                >
                  <div className="gsi-material-button-state" />
                  <div className="gsi-material-button-content-wrapper">
                    <div className="gsi-material-button-icon">
                      <svg
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 48 48"
                        style={{display: 'block'}}
                      >
                        <path
                          fill="#EA4335"
                          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                        />
                        <path
                          fill="#4285F4"
                          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                        />
                        <path
                          fill="#34A853"
                          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                        />
                        <path fill="none" d="M0 0h48v48H0z" />
                      </svg>
                    </div>
                    <span className="gsi-material-button-contents">
                      {isLoggingIn ? 'Signing in...' : 'Sign in with Google'}
                    </span>
                    <span style={{display: 'none'}}>Sign in with Google</span>
                  </div>
                </button>
              </div>
            </div>
          ) : result ? (
            <div className="rounded-2xl bg-white border border-[#134435]/25 p-5 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-[#134435] mx-auto" />
              <div className="space-y-1">
                <h4 className="font-display font-black text-base text-[#134435]">
                  تم رفع جميع ملفات المشروع إلى Google Drive بنجاح
                </h4>
                <p className="font-body text-xs text-[#354E44]">
                  المجلد: <span className="font-bold">{result.folderName}</span> · تم رفع{' '}
                  <span className="font-num font-bold">{result.uploadedFilesCount}</span> ملفاً
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
                <a
                  href={result.folderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 px-5 rounded-xl bg-[#134435] hover:bg-[#0B2D22] text-white font-display font-bold text-xs inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-[#F2CE74]" />
                  <span>فتح المجلد في Google Drive</span>
                </a>
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="h-10 px-4 rounded-xl bg-[#EAF1EA] hover:bg-[#DCE8DC] text-[#134435] font-display font-bold text-xs cursor-pointer"
                >
                  رفع مجلد آخر
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleConfirmUpload} className="space-y-4">
              <div className="rounded-2xl bg-white border border-[#D4DDD2] p-4 space-y-3">
                <div>
                  <label
                    htmlFor="drive-folder-name"
                    className="block font-display font-bold text-xs text-[#134435] mb-1.5"
                  >
                    اسم المجلد الجديد على Google Drive
                  </label>
                  <input
                    id="drive-folder-name"
                    type="text"
                    required
                    maxLength={100}
                    disabled={uploading}
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#C6D1C3] bg-[#FAFBF7] text-sm font-body text-[#11261E] disabled:opacity-60"
                    dir="ltr"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs font-body text-[#354E44] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeZipArchive}
                    disabled={uploading}
                    onChange={(e) => setIncludeZipArchive(e.target.checked)}
                    className="rounded border-[#134435] accent-[#134435]"
                  />
                  <span>تضمين النسخة المضغوطة (gesour-github-pages.zip) داخل المجلد أيضاً</span>
                </label>

                <div className="rounded-xl bg-[#EAF1EA]/70 border border-[#D4DDD2] p-3 text-xs font-body text-[#354E44] space-y-1">
                  <div className="font-display font-bold text-[#134435]">
                    تأكيد العملية: سيتم إنشاء مجلد «{folderName.trim() || 'Josour-Website-Project'}»
                    ورفع {projectFiles.length + (includeZipArchive ? 1 : 0)} ملفاً إلى حسابك في
                    Google Drive.
                  </div>
                  <div className="text-[11px] text-[#4B6359]">
                    يشمل مجلدات src و public و .github/workflows وجميع ملفات المشروع.
                  </div>
                </div>
              </div>

              {uploading && progress && (
                <div className="rounded-xl bg-white border border-[#E0B347] p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-display font-bold text-[#134435]">
                    <span className="inline-flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#D7A134]" />
                      <span>جاري الرفع إلى Google Drive...</span>
                    </span>
                    <span className="font-num">
                      {progress.uploaded} / {progress.total} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#EAF1EA] overflow-hidden">
                    <div
                      className="h-full bg-[#134435] transition-all duration-200"
                      style={{width: `${pct}%`}}
                    />
                  </div>
                  <p className="text-[11px] font-num text-[#4B6359] truncate" dir="ltr">
                    {progress.currentPath}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 h-11 rounded-xl bg-[#134435] hover:bg-[#0B2D22] text-white font-display font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
                >
                  <FolderUp className="w-4 h-4 text-[#F2CE74]" />
                  <span>
                    {uploading
                      ? 'جاري رفع الملفات...'
                      : 'تأكيد ورفع كل ملفات المشروع إلى Drive'}
                  </span>
                </button>
                {uploading && (
                  <button
                    type="button"
                    onClick={() => abortRef.current?.abort()}
                    className="h-11 px-4 rounded-xl bg-red-50 border border-red-200 text-red-700 font-display font-bold text-xs cursor-pointer"
                  >
                    إلغاء
                  </button>
                )}
              </div>
            </form>
          )}

          {errorMsg && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-body text-red-800">
              {errorMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
