import React from "react";

export default function KnowledgeQuickViewModal({ article, onClose }) {
  if (!article) return null;

  const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getInitials = (title = "") => {
    const parts = title.trim().split(" ");
    if (parts.length === 0) return "KV";
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "K";
    return (
      (parts[0][0] || "").toUpperCase() +
      (parts[parts.length - 1][0] || "").toUpperCase()
    );
  };

  return (
    <div className="tw-fixed tw-inset-0 tw-z-50 tw-bg-black/50 tw-backdrop-blur-sm tw-flex tw-items-center tw-justify-center tw-px-3 tw-pt-[80px]"
      onClick={onClose}>
        <div className="tw-bg-white tw-rounded-[28px] tw-w-full tw-max-w-[960px] tw-max-h-[80vh] tw-overflow-hidden 
            tw-shadow-[0_18px_60px_rgba(15,23,42,0.32)] tw-border tw-border-slate-100/80 tw-grid md:tw-grid-cols-[1.25fr,1.75fr] tw-gap-0"
            onClick={(e) => e.stopPropagation()}>
            {/* LEFT: Ảnh / gradient */}
            <div className="tw-relative tw-bg-slate-900 tw-h-[180px] md:tw-h-full">
                {article.thumbnail ? (
                    <img src={article.thumbnail} alt={article.title}
                    className="tw-w-full tw-h-full tw-object-cover"
                    />
                ) : (
                    <div className="tw-w-full tw-h-full tw-bg-gradient-to-br tw-from-sky-500 tw-via-blue-500 tw-to-pink-500 tw-flex tw-items-center tw-justify-center">
                    <span className="tw-text-[34px] tw-font-extrabold tw-text-white/90">
                        {getInitials(article.title)}
                    </span>
                    </div>
                )}
                <div className="tw-absolute tw-bottom-3 tw-left-3 tw-right-3 tw-flex tw-items-center tw-justify-between tw-gap-2">
                    <div className="tw-flex tw-items-center tw-gap-2">
                        <div className="tw-w-7 tw-h-7 tw-rounded-full tw-bg-white/90 tw-flex tw-items-center tw-justify-center tw-text-[9px] tw-font-semibold tw-text-slate-900">
                            KV
                        </div>
                        <div className="tw-flex tw-flex-col tw-text-white">
                            <span className="tw-text-[8px] tw-uppercase tw-tracking-[0.16em] tw-text-white/80">
                                Kiến thức tiêm chủng
                            </span>
                            <span className="tw-text-[8px] tw-text-white/75">
                                {article.categoryName || "Bài viết đã duyệt"}
                            </span>
                        </div>
                    </div>
                    <div className="tw-px-2.5 tw-py-1 tw-bg-black/55 tw-backdrop-blur-sm tw-rounded-full tw-text-[8px] tw-text-white/85">
                        {formatDate(article.publishedAt) || "Đã xuất bản"}
                    </div>
                </div>
            </div>

            {/* RIGHT: Nội dung đọc nhanh */}
            <div className="tw-relative tw-flex tw-flex-col tw-p-4 md:tw-p-5 tw-space-y-2 tw-max-h-[82vh] tw-overflow-hidden">
                <button className="tw-absolute tw-top-4 tw-right-6 tw-w-9 tw-h-9 tw-rounded-full tw-flex tw-items-center tw-justify-center 
                            tw-bg-slate-100 hover:tw-bg-slate-200 tw-text-slate-500 hover:tw-text-red-600 tw-text-sm tw-transition"
                    onClick={onClose} >
                    <i className="fa-solid fa-xmark tw-text-lg"></i>
                </button>

                <div className="tw-flex tw-flex-wrap tw-gap-2 tw-pr-8 tw-mb-1">
                    {article.categoryName && (
                    <span className="tw-text-[8px] tw-px-2 tw-py-0.5 tw-rounded-full tw-bg-pink-100 tw-text-pink-700">
                        {article.categoryName}
                    </span>
                    )}
                    {article.disease && (
                    <span className="tw-text-[8px] tw-px-2 tw-py-0.5 tw-rounded-full tw-bg-sky-50 tw-text-sky-700">
                        Bệnh: {article.disease}
                    </span>
                    )}
                    {article.vaccine && (
                    <span className="tw-text-[8px] tw-px-2 tw-py-0.5 tw-rounded-full tw-bg-emerald-50 tw-text-emerald-700">
                        Vắc xin: {article.vaccine}
                    </span>
                    )}
                </div>

                <h2 className="tw-text-[15px] md:tw-text-[17px] tw-font-semibold tw-text-blue-900 tw-leading-snug">
                    {article.title}
                </h2>
                {article.summary && (
                    <p className="tw-text-[10px] tw-text-slate-500 tw-italic">  {article.summary} </p>
                )}
                <div className="tw-mt-1.5 tw-flex-1 tw-pr-1.5 tw-text-[11px] tw-leading-relaxed tw-text-slate-700 tw-space-y-2 
                    tw-overflow-y-auto tw-text-justify [&::-webkit-scrollbar]:tw-w-1.5 [&::-webkit-scrollbar-track]:tw-bg-slate-50 
                    [&::-webkit-scrollbar-thumb]:tw-bg-slate-300 [&::-webkit-scrollbar-thumb]:tw-rounded-full">
                    <div className="tw-whitespace-pre-line tw-mx-10">
                        {article.content}
                    </div>
                </div>
                <div className="tw-pt-1 tw-flex tw-items-center tw-justify-between tw-text-[8px] tw-text-slate-400">
                    <span>  Nội dung cung cấp bởi hệ thống tiêm chủng điện tử • Đã kiểm duyệt </span>
                </div>
            </div>
        </div>
    </div>
  );
}
