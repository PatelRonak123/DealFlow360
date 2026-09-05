import toast from 'react-hot-toast';

export const showProgressToast = (
  message: string,
  progress: number,
  toastId = 'auth-progress'
): void => {
  toast.custom(
    (currentToast) => (
      <div
        className={`w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-[#DCE4F0] bg-white p-4 shadow-[0_16px_40px_rgba(38,76,130,0.16)] transition ${
          currentToast.visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-[#27334A]">{message}</p>
          <span className="text-xs font-bold text-[#3165E8]">{progress}%</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#EAF0F8]">
          <div
            className="h-full rounded-full bg-[#3165E8] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    ),
    { id: toastId, duration: Infinity }
  );
};
