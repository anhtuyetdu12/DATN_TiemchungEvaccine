// src/pages/StaffKnowledgeManager.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  getKnowledgeCategories,
  getKnowledgeArticles,
  createKnowledgeArticle,
  updateKnowledgeArticle,
  submitKnowledgeArticle,
  uploadKnowledgeThumbnail,
} from "../../services/knowledgeService";

const TOPIC_TEMPLATES = {
  HE_THONG_DIEN_TU: {
    label: "Hệ thống quản lý tiêm chủng điện tử",
    hint: "Mô tả kiến trúc, phân quyền, quy trình nhập liệu, đồng bộ dữ liệu, tích hợp hệ thống quốc gia.",
    sample: `1. Mục tiêu hệ thống
- Chuẩn hoá quản lý thông tin tiêm chủng.
- Đồng bộ dữ liệu với hệ thống tiêm chủng quốc gia.

2. Cấu trúc hệ thống
- Các phân hệ chính và phân quyền.

3. Quy trình nghiệp vụ
- Đăng ký, khám sàng lọc, tiêm, ghi nhận mũi, báo cáo.

4. An toàn & bảo mật
- Phân quyền, lưu vết, bảo mật dữ liệu.`,
  },
  QUY_TRINH_TAI_BAN: {
    label: "Quy trình tại bàn tiêm & đối soát",
    hint: "Chuẩn hoá thao tác tại tiếp nhận, sàng lọc, tiêm, nhập liệu, theo dõi, đối soát.",
    sample: `1. Sơ đồ luồng khách tại cơ sở
2. Thao tác tại từng chốt (tiếp nhận, khám, tiêm, theo dõi)
3. Ghi nhận trên hệ thống tại chỗ
4. Đối soát cuối ca/ngày.`,
  },
  AN_TOAN_TCMR: {
    label: "An toàn tiêm chủng & phản ứng sau tiêm",
    hint: "Hướng dẫn giám sát, ghi nhận, báo cáo và xử trí phản ứng sau tiêm.",
    sample: `1. Nguyên tắc an toàn tiêm chủng
2. Phân loại phản ứng sau tiêm
3. Cách ghi nhận trên hệ thống
4. Quy trình báo cáo và theo dõi.`,
  },
};

export default function StaffKnowledgeManager() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const [filters, setFilters] = useState({ status: "", category: "", visibility: "", search: "" });

  const emptyForm = {
    title: "",
    summary: "",
    content: "",
    category: "",
    visibility: "normal",
    disease: "",
    vaccine: "",
    topicTemplate: "",
    thumbnail: "",
  };
  const [form, setForm] = useState(emptyForm);

  const cleanFilterForApi = (f) => {
    const params = { ...f };
    delete params.search;
    if (!params.status) delete params.status;
    if (!params.category) delete params.category;
    if (!params.visibility) delete params.visibility;
    return params;
  };

  const loadData = async (f = filters) => {
    setLoading(true);
    const [cats, arts] = await Promise.all([
      getKnowledgeCategories(),
      getKnowledgeArticles({ mine: 1, ...cleanFilterForApi(f) }),
    ]);
    setCategories(cats);
    setArticles(arts);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, []);

  const onChangeFilter = async (name, value) => {
    const next = { ...filters, [name]: value };
    if (name === "visibility") next.category = "";
    if (name === "category") next.visibility = "";
    setFilters(next);
    setLoading(true);
    const arts = await getKnowledgeArticles({ mine: 1, ...cleanFilterForApi(next) });
    setArticles(arts);
    setLoading(false);
  };

  const handleSearchChange = (value) => {
    const next = { ...filters, search: value };
    setFilters(next);
  };

  const filteredArticles = useMemo(() => {
    if (!filters.search) return articles;
    const q = filters.search.toLowerCase();
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.summary || "").toLowerCase().includes(q) ||
        (a.content || "").toLowerCase().includes(q)
    );
  }, [articles, filters.search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (article) => {
    setEditing(article);
    setForm({
      title: article.title,
      summary: article.summary,
      content: article.content,
      category: article.category || "",
      visibility: article.visibility || "normal",
      disease: article.disease || "",
      vaccine: article.vaccine || "",
      topicTemplate: "",
      thumbnail: article.thumbnail || "",
    });
    setShowForm(true);
  };

  const applyTemplate = (code) => {
    const tpl = TOPIC_TEMPLATES[code];
    if (!tpl) return;
    setForm((cur) => ({
      ...cur,
      topicTemplate: code,
      summary: cur.summary || tpl.hint,
      content: cur.content || tpl.sample,
    }));
  };

  const handleThumbnailSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingThumb(true);
    try {
      const url = await uploadKnowledgeThumbnail(file);
      setForm((cur) => ({ ...cur, thumbnail: url }));
    } catch (err) {
      console.error(err);
      alert("Upload ảnh thất bại. Vui lòng thử lại.");
    } finally {
      setUploadingThumb(false);
    }
  };

  const saveArticle = async (e) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      summary: form.summary,
      content: form.content,
      category: form.category || null,
      visibility: form.visibility,
      disease: form.disease || null,
      vaccine: form.vaccine || null,
      thumbnail: form.thumbnail || null,
    };
    if (!editing) await createKnowledgeArticle(payload);
    else await updateKnowledgeArticle(editing.id, payload);

    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    await loadData();
  };

  const handleSubmitArticle = async (id) => {
    try {
      await submitKnowledgeArticle(id);
      const arts = await getKnowledgeArticles({ mine: 1, ...cleanFilterForApi(filters) });
      setArticles(arts);
      alert("Đã gửi duyệt bài viết.");
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.detail ||
        "Không thể gửi duyệt. Vui lòng tải lại trang và thử lại.";
      alert(msg);
    }
  };

  const renderStatus = (s) => {
    const map = {
      draft: "tw-bg-slate-100 tw-text-slate-700",
      pending: "tw-bg-amber-50 tw-text-amber-600",
      published: "tw-bg-emerald-50 tw-text-emerald-600",
      rejected: "tw-bg-rose-50 tw-text-rose-600",
    };
    const label = {
      draft: "Nháp",
      pending: "Chờ duyệt",
      published: "Đã xuất bản",
      rejected: "Từ chối",
    };
    return (
      <span className={`tw-text-[9px] tw-px-2.5 tw-py-1 tw-rounded-full tw-border ${map[s] || "tw-bg-slate-50 tw-text-slate-600"}`}>
        {label[s] || s}
      </span>
    );
  };

  const findCategoryIdByCode = (code) => {
    const cat = categories.find((c) => c.code === code);
    return cat ? String(cat.id) : "";
  };

  const draftCount = articles.filter((a) => a.status === "draft").length;
  const pendingCount = articles.filter((a) => a.status === "pending").length;
  const publishedCount = articles.filter((a) => a.status === "published").length;

  return (
    <div className="tw-min-h-screen tw-bg-[radial-gradient(circle_at_top,_#e0f2fe_0%,_white_45%)] tw-pt-[110px] tw-pb-10">
      <div className="tw-max-w-[1280px] tw-mx-auto tw-px-6 tw-space-y-6">

        {/* HEADER */}
        <header className="tw-bg-[#062b4f] tw-rounded-2xl tw-px-6 tw-py-5 tw-flex tw-items-center tw-justify-between tw-gap-4 tw-shadow-sm">
          <div>
            <p className="tw-text-[9px] tw-uppercase tw-tracking-[0.16em] tw-text-cyan-200">
              Trung tâm biên tập nội bộ • Hệ thống tiêm chủng điện tử
            </p>
            <h1 className="tw-text-xl tw-font-semibold tw-text-white tw-mt-1">
              Quản lý bài viết nghiệp vụ cho nhân viên y tế
            </h1>
            <p className="tw-text-[10px] tw-text-slate-200 tw-mt-1">
              Soạn, chuẩn hoá và gửi duyệt nội dung hướng dẫn hệ thống, quy trình và an toàn tiêm chủng.
            </p>
          </div>
          <div className="tw-flex tw-flex-col tw-items-end tw-gap-1.5">
            <button
              onClick={openCreate}
              className="tw-bg-gradient-to-r tw-from-pink-500 tw-to-sky-500 tw-text-white tw-px-4 tw-py-2 tw-rounded-xl tw-font-medium tw-text-[11px] hover:tw-scale-[1.03] tw-transition tw-shadow-sm"
            >
              + Viết bài mới
            </button>
            <div className="tw-flex tw-gap-3 tw-text-[9px] tw-text-cyan-100">
              <span>Nháp: <b>{draftCount}</b></span>
              <span>Chờ duyệt: <b>{pendingCount}</b></span>
              <span>Đã xuất bản: <b>{publishedCount}</b></span>
            </div>
          </div>
        </header>

        {/* FILTER BAR */}
        <div className="tw-flex tw-flex-wrap tw-gap-2 tw-items-center">
          <button
            onClick={() => onChangeFilter("visibility", "")}
            className={`tw-px-4 tw-py-1.5 tw-rounded-full tw-text-[10px] tw-font-medium tw-border ${
              !filters.visibility && !filters.category
                ? "tw-bg-[#14395f] tw-text-white tw-border-[#14395f]"
                : "tw-bg-white tw-text-slate-700 tw-border-slate-200"
            }`}
          >
            Tất cả bài của bạn
          </button>

          <button
            onClick={() => onChangeFilter("visibility", "multimedia")}
            className={`tw-px-3.5 tw-py-1.5 tw-rounded-full tw-text-[10px] tw-border ${
              filters.visibility === "multimedia"
                ? "tw-bg-[#14395f] tw-text-white tw-border-[#14395f]"
                : "tw-bg-white tw-text-slate-700 tw-border-slate-200"
            }`}
          >
            Multimedia / Video
          </button>

          <button
            onClick={() => onChangeFilter("category", findCategoryIdByCode("HE_THONG"))}
            className={`tw-px-3.5 tw-py-1.5 tw-rounded-full tw-text-[10px] tw-border ${
              filters.category === findCategoryIdByCode("HE_THONG")
                ? "tw-bg-[#14395f] tw-text-white tw-border-[#14395f]"
                : "tw-bg-white tw-text-slate-700 tw-border-slate-200"
            }`}
          >
            Hệ thống điện tử
          </button>

          <button
            onClick={() => onChangeFilter("category", findCategoryIdByCode("QUY_TRINH"))}
            className={`tw-px-3.5 tw-py-1.5 tw-rounded-full tw-text-[10px] tw-border ${
              filters.category === findCategoryIdByCode("QUY_TRINH")
                ? "tw-bg-[#14395f] tw-text-white tw-border-[#14395f]"
                : "tw-bg-white tw-text-slate-700 tw-border-slate-200"
            }`}
          >
            Quy trình tại cơ sở
          </button>

          <button
            onClick={() => onChangeFilter("category", findCategoryIdByCode("AN_TOAN"))}
            className={`tw-px-3.5 tw-py-1.5 tw-rounded-full tw-text-[10px] tw-border ${
              filters.category === findCategoryIdByCode("AN_TOAN")
                ? "tw-bg-[#14395f] tw-text-white tw-border-[#14395f]"
                : "tw-bg-white tw-text-slate-700 tw-border-slate-200"
            }`}
          >
            An toàn & phản ứng sau tiêm
          </button>

          <div className="tw-ml-auto tw-flex tw-items-center tw-gap-2">
            <input
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Tìm theo tiêu đề, tóm tắt, nội dung..."
              className="tw-text-[10px] tw-px-3 tw-py-1.5 tw-rounded-full tw-border tw-border-slate-200 tw-min-w-[220px] focus:tw-outline-none focus:tw-border-[#14395f]"
            />
            <select
              value={filters.status}
              onChange={(e) => onChangeFilter("status", e.target.value)}
              className="tw-text-[9px] tw-px-2.5 tw-py-1.5 tw-rounded-full tw-border tw-border-slate-200 tw-bg-white"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="draft">Nháp</option>
              <option value="pending">Chờ duyệt</option>
              <option value="published">Đã xuất bản</option>
              <option value="rejected">Từ chối</option>
            </select>
          </div>
        </div>

        <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-[1.5fr,1fr] tw-gap-6">

          {/* LIST BÀI */}
          <div className="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-overflow-hidden">
            <div className="tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-3 tw-border-b tw-border-slate-100">
              <div>
                <p className="tw-text-[11px] tw-font-semibold tw-text-slate-800">
                  Bài viết nội bộ của bạn
                </p>
                <p className="tw-text-[9px] tw-text-slate-400">
                  Nhấn tiêu đề để chỉnh sửa, gửi duyệt khi nội dung hoàn chỉnh.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="tw-p-10 tw-text-center tw-text-slate-400 tw-text-[11px]">
                Đang tải dữ liệu, vui lòng chờ...
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="tw-p-10 tw-text-center tw-text-slate-400 tw-text-[11px]">
                Không có bài viết phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              <ul className="tw-divide-y tw-divide-slate-100">
                {filteredArticles.map((a) => (
                  <li key={a.id} className="tw-px-4 tw-py-3.5 tw-flex tw-gap-3 hover:tw-bg-slate-50 tw-transition">
                    <div className="tw-w-20 tw-h-16 tw-rounded-xl tw-overflow-hidden tw-flex-shrink-0 tw-bg-slate-100 tw-flex tw-items-center tw-justify-center">
                      {a.thumbnail ? (
                        <img src={a.thumbnail} alt={a.title} className="tw-w-full tw-h-full tw-object-cover" />
                      ) : (
                        <span className="tw-text-[8px] tw-text-slate-500">
                          {a.visibility === "multimedia" ? "MULTIMEDIA" : a.visibility === "featured" ? "FEATURED" : "NO IMAGE"}
                        </span>
                      )}
                    </div>

                    <div className="tw-flex-1 tw-min-w-0">
                      <div className="tw-flex tw-items-center tw-gap-2 tw-mb-0.5">
                        <h3
                          className="tw-font-semibold tw-text-slate-900 tw-text-[12px] tw-truncate tw-cursor-pointer hover:tw-text-[#14395f]"
                          onClick={() => openEdit(a)}
                        >
                          {a.title}
                        </h3>
                        {renderStatus(a.status)}
                      </div>
                      <p className="tw-text-[9px] tw-text-slate-400">
                        {a.categoryName || "Chưa gán danh mục"} • {a.authorName ? `Tác giả: ${a.authorName}` : "Chưa gán tác giả"}
                      </p>
                      {a.summary && (
                        <p className="tw-text-[10px] tw-text-slate-600 tw-mt-0.5 tw-line-clamp-2">
                          {a.summary}
                        </p>
                      )}
                    </div>

                    <div className="tw-flex tw-flex-col tw-gap-1 tw-items-end tw-text-[9px]">
                      {(a.status === "draft" || a.status === "rejected") && (
                        <button
                          onClick={() => openEdit(a)}
                          className="tw-text-[#14395f] tw-bg-slate-100 tw-px-3 tw-py-1 tw-rounded-lg hover:tw-bg-slate-200"
                        >
                          Sửa
                        </button>
                      )}
                      {a.status === "draft" && (
                        <button
                          onClick={() => handleSubmitArticle(a.id)}
                          className="tw-text-emerald-700 tw-bg-emerald-50 tw-px-3 tw-py-1 tw-rounded-lg hover:tw-bg-emerald-100"
                        >
                          Gửi duyệt
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* CỘT PHẢI: PREVIEW + STATS + FORM */}
          <div className="tw-space-y-4">
            {/* Preview card */}
            <div className="tw-bg-[#062b4f] tw-rounded-2xl tw-p-4 tw-text-white tw-shadow-sm">
              <p className="tw-text-[8px] tw-uppercase tw-mb-2 tw-text-cyan-200">
                Xem trước hiển thị trên trang khách
              </p>
              <div className="tw-bg-white tw-rounded-xl tw-overflow-hidden tw-flex tw-gap-3">
                <div className="tw-w-20 tw-h-20 tw-flex-shrink-0">
                  {form.thumbnail ? (
                    <img src={form.thumbnail} alt="Thumbnail preview" className="tw-w-full tw-h-full tw-object-cover" />
                  ) : (
                    <div className="tw-w-full tw-h-full tw-bg-gradient-to-b tw-from-sky-200 tw-to-white tw-flex tw-items-center tw-justify-center tw-text-[8px] tw-text-slate-500">
                      Ảnh minh hoạ
                    </div>
                  )}
                </div>
                <div className="tw-py-3 tw-pr-3 tw-flex-1">
                  <p className="tw-text-[8px] tw-font-semibold tw-text-pink-500">
                    {form.visibility === "multimedia" ? "MULTIMEDIA" : form.visibility === "featured" ? "BÀI NỔI BẬT" : "BÀI VIẾT KIẾN THỨC"}
                  </p>
                  <h4 className="tw-text-[12px] tw-font-semibold tw-text-slate-900 tw-line-clamp-2 tw-mt-0.5">
                    {form.title || "Tiêu đề bài viết sẽ hiển thị tại đây"}
                  </h4>
                  <p className="tw-text-[9px] tw-text-slate-500 tw-line-clamp-2 tw-mt-1">
                    {form.summary || "Tóm tắt 2-3 câu giúp khách hiểu nhanh nội dung bài viết."}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="tw-bg-white tw-rounded-2xl tw-p-4 tw-shadow-sm">
              <h3 className="tw-text-[10px] tw-font-semibold tw-mb-3 tw-text-slate-900">
                Tổng quan biên tập
              </h3>
              <div className="tw-flex tw-gap-3">
                <div className="tw-flex-1 tw-bg-slate-50 tw-rounded-lg tw-p-3">
                  <p className="tw-text-[8px] tw-text-slate-400">Nháp</p>
                  <p className="tw-text-lg tw-font-bold tw-text-slate-700">{draftCount}</p>
                </div>
                <div className="tw-flex-1 tw-bg-amber-50 tw-rounded-lg tw-p-3">
                  <p className="tw-text-[8px] tw-text-amber-500">Chờ duyệt</p>
                  <p className="tw-text-lg tw-font-bold tw-text-amber-600">{pendingCount}</p>
                </div>
                <div className="tw-flex-1 tw-bg-emerald-50 tw-rounded-lg tw-p-3">
                  <p className="tw-text-[8px] tw-text-emerald-500">Đã xuất bản</p>
                  <p className="tw-text-lg tw-font-bold tw-text-emerald-600">{publishedCount}</p>
                </div>
              </div>
            </div>

            {/* Form create/edit */}
            {showForm ? (
              <div className="tw-bg-white tw-rounded-2xl tw-p-4 tw-shadow-sm tw-border tw-border-slate-100">
                <div className="tw-flex tw-justify-between tw-items-center tw-mb-3">
                  <div>
                    <h2 className="tw-text-[11px] tw-font-semibold tw-text-slate-900">
                      {editing ? "Chỉnh sửa bài viết nghiệp vụ" : "Tạo bài viết nghiệp vụ mới"}
                    </h2>
                    <p className="tw-text-[8px] tw-text-slate-400">
                      Tập trung mô tả quy trình, thao tác và hướng dẫn dùng hệ thống.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditing(null);
                      setForm(emptyForm);
                    }}
                    className="tw-text-slate-400 hover:tw-text-slate-700 tw-text-sm"
                  >
                    ✕
                  </button>
                </div>

                {/* Templates */}
                <div className="tw-mb-3 tw-flex tw-flex-wrap tw-gap-2">
                  {Object.entries(TOPIC_TEMPLATES).map(([code, tpl]) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => applyTemplate(code)}
                      className={`tw-text-[8px] tw-px-2.5 tw-py-1.5 tw-rounded-full tw-border ${
                        form.topicTemplate === code
                          ? "tw-bg-sky-50 tw-border-sky-400 tw-text-sky-700"
                          : "tw-bg-slate-50 tw-border-slate-200 tw-text-slate-600"
                      }`}
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>

                <form onSubmit={saveArticle} className="tw-space-y-3">
                  <div className="tw-grid tw-grid-cols-[1.7fr,1.3fr] tw-gap-3">
                    <div>
                      <label className="tw-block tw-text-[8px] tw-mb-1">Tiêu đề bài viết</label>
                      <input
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-1.5 tw-text-[10px]"
                        placeholder="Ví dụ: Hướng dẫn sử dụng hệ thống tiêm chủng tại cơ sở..."
                        required
                      />
                    </div>
                    <div>
                      <label className="tw-block tw-text-[8px] tw-mb-1">Ảnh minh hoạ (thumbnail)</label>
                      <div className="tw-flex tw-items-center tw-gap-2">
                        <input type="file" accept="image/*" onChange={handleThumbnailSelect} className="tw-text-[8px] tw-w-[72%]" />
                        {uploadingThumb && (
                          <span className="tw-text-[8px] tw-text-slate-500">Đang upload...</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                    <div>
                      <label className="tw-block tw-text-[8px] tw-mb-1">Danh mục</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-1.5 tw-text-[10px]"
                      >
                        <option value="">-- Chọn danh mục --</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="tw-block tw-text-[8px] tw-mb-1">Kiểu hiển thị</label>
                      <select
                        value={form.visibility}
                        onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                        className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-1.5 tw-text-[10px]"
                      >
                        <option value="normal">Bình thường</option>
                        <option value="featured">Nổi bật</option>
                        <option value="multimedia">Multimedia</option>
                      </select>
                    </div>
                  </div>

                  <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                    <div>
                      <label className="tw-block tw-text-[8px] tw-mb-1">Liên quan bệnh / nhóm bệnh</label>
                      <input
                        value={form.disease}
                        onChange={(e) => setForm({ ...form, disease: e.target.value })}
                        className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-1.5 tw-text-[10px]"
                        placeholder="VD: COVID-19, Sởi, Cúm..."
                      />
                    </div>
                    <div>
                      <label className="tw-block tw-text-[8px] tw-mb-1">Vaccine liên quan</label>
                      <input
                        value={form.vaccine}
                        onChange={(e) => setForm({ ...form, vaccine: e.target.value })}
                        className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-1.5 tw-text-[10px]"
                        placeholder="VD: Pfizer, ComBE Five..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="tw-block tw-text-[8px] tw-mb-1">Tóm tắt ngắn</label>
                    <textarea
                      rows={2}
                      value={form.summary}
                      onChange={(e) => setForm({ ...form, summary: e.target.value })}
                      className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-1.5 tw-text-[10px]"
                      placeholder="Tóm tắt 2-3 câu để người đọc hiểu nhanh nội dung."
                    />
                  </div>

                  <div>
                    <label className="tw-block tw-text-[8px] tw-mb-1">Nội dung chi tiết</label>
                    <textarea
                      rows={6}
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-1.5 tw-text-[10px] tw-font-mono"
                      placeholder="Mô tả rõ mục tiêu, quy trình, bước thực hiện, lưu ý, ví dụ minh hoạ..."
                      required
                    />
                  </div>

                  <div className="tw-flex tw-justify-end tw-gap-2 tw-pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditing(null);
                        setForm(emptyForm);
                      }}
                      className="tw-border tw-border-slate-200 tw-rounded-lg tw-px-4 tw-py-1.5 tw-text-[9px]"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="tw-bg-[#14395f] tw-text-white tw-rounded-lg tw-px-4 tw-py-1.5 tw-text-[9px]"
                    >
                      Lưu nháp
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="tw-bg-white tw-rounded-2xl tw-p-4 tw-shadow-sm">
                <p className="tw-text-[9px] tw-text-slate-500">
                  Chọn một bài bên trái để chỉnh sửa hoặc bấm <span className="tw-font-semibold">“+ Viết bài mới”</span> để tạo hướng dẫn mới.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
