// src/pages/StaffKnowledgeManager.jsx
import React, { useEffect, useState } from "react";
import {
  getKnowledgeCategories,
  getKnowledgeArticles,
  createKnowledgeArticle,
  updateKnowledgeArticle,
  submitKnowledgeArticle,
} from "../../services/knowledgeService";

export default function StaffKnowledgeManager() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  // filter theo status + category + visibility (để map 3 block của trang khách)
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    visibility: "",
  });

  const emptyForm = {
    title: "",
    summary: "",
    content: "",
    category: "",
    visibility: "normal",
    disease: "",
    vaccine: "",
  };
  const [form, setForm] = useState(emptyForm);

  const loadData = async (f = filters) => {
    setLoading(true);
    const [cats, arts] = await Promise.all([
      getKnowledgeCategories(),
      getKnowledgeArticles({ mine: 1, ...f }),
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
    // reset filter khác nếu chọn theo “channel”
    if (name === "visibility") {
      next.category = "";
    }
    if (name === "category") {
      next.visibility = "";
    }
    setFilters(next);
    setLoading(true);
    const arts = await getKnowledgeArticles({ mine: 1, ...next });
    setArticles(arts);
    setLoading(false);
  };

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
    });
    setShowForm(true);
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
    };
    if (!editing) {
      await createKnowledgeArticle(payload);
    } else {
      await updateKnowledgeArticle(editing.id, payload);
    }
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    await loadData();
  };

  const handleSubmitArticle = async (id) => {
    await submitKnowledgeArticle(id);
    const arts = await getKnowledgeArticles({ mine: 1, ...filters });
    setArticles(arts);
  };

  const renderStatus = (s) => {
    const map = {
      draft: "tw-bg-slate-200 tw-text-slate-700",
      pending: "tw-bg-amber-100 tw-text-amber-700",
      published: "tw-bg-emerald-100 tw-text-emerald-700",
      rejected: "tw-bg-rose-100 tw-text-rose-700",
    };
    const label = {
      draft: "Nháp",
      pending: "Chờ duyệt",
      published: "Đã xuất bản",
      rejected: "Từ chối",
    };
    return (
      <span className={`tw-text-xs tw-px-3 tw-py-1 tw-rounded-full ${map[s] || ""}`}>
        {label[s] || s}
      </span>
    );
  };

  // tìm id danh mục theo code để filter nhanh (vì trang khách đang xài các block cố định)
  const findCategoryIdByCode = (code) => {
    const cat = categories.find((c) => c.code === code);
    return cat ? String(cat.id) : ""; // filter API nhận id
  };

  return (
    <div className="tw-min-h-screen tw-bg-[radial-gradient(circle_at_top,_#e0f2fe_0%,_white_45%)] tw-pt-[110px] tw-pb-10">
      <div className="tw-max-w-[1200px] tw-mx-auto tw-px-6 tw-space-y-6">

        {/* HEADER */}
        <header className="tw-bg-[#062b4f] tw-rounded-2xl tw-px-6 tw-py-5 tw-flex tw-items-center tw-justify-between">
          <div>
            <p className="tw-text-xs tw-uppercase tw-tracking-wide tw-text-cyan-100">
              Trung tâm nội dung tiêm chủng
            </p>
            <h1 className="tw-text-2xl tw-font-bold tw-text-white">
              Quản lý bài viết hiển thị cho khách
            </h1>
            <p className="tw-text-sm tw-text-slate-200">
              Staff soạn → Gửi duyệt → Admin Publish → hiển thị ở trang “Kiến thức tiêm chủng”
            </p>
          </div>
          <button
            onClick={openCreate}
            className="tw-bg-gradient-to-r tw-from-pink-500 tw-to-blue-500 tw-text-white tw-px-4 tw-py-2 tw-rounded-xl tw-font-medium"
          >
            + Bài mới
          </button>
        </header>

        {/* THANH KÊNH (KHỚP KHÁCH) */}
        <div className="tw-flex tw-gap-3 tw-flex-wrap">
          <button
            onClick={() => onChangeFilter("visibility", "")}
            className={`tw-px-4 tw-py-2 tw-rounded-xl tw-text-sm tw-font-medium ${
              !filters.visibility && !filters.category
                ? "tw-bg-[#14395f] tw-text-white"
                : "tw-bg-white tw-text-slate-600 tw-border tw-border-slate-200"
            }`}
          >
            Tất cả
          </button>

          {/* Multimedia */}
          <button
            onClick={() => onChangeFilter("visibility", "multimedia")}
            className={`tw-px-4 tw-py-2 tw-rounded-xl tw-text-sm tw-font-medium ${
              filters.visibility === "multimedia"
                ? "tw-bg-[#14395f] tw-text-white"
                : "tw-bg-white tw-text-slate-600 tw-border tw-border-slate-200"
            }`}
          >
            Multimedia (khối xanh)
          </button>

          {/* Thông tin sức khỏe */}
          <button
            onClick={() =>
              onChangeFilter("category", findCategoryIdByCode("SUC_KHOE"))
            }
            className={`tw-px-4 tw-py-2 tw-rounded-xl tw-text-sm tw-font-medium ${
              filters.category === findCategoryIdByCode("SUC_KHOE")
                ? "tw-bg-[#14395f] tw-text-white"
                : "tw-bg-white tw-text-slate-600 tw-border tw-border-slate-200"
            }`}
          >
            Thông tin sức khỏe
          </button>

          {/* Theo đối tượng */}
          <button
            onClick={() =>
              onChangeFilter("category", findCategoryIdByCode("DOI_TUONG"))
            }
            className={`tw-px-4 tw-py-2 tw-rounded-xl tw-text-sm tw-font-medium ${
              filters.category === findCategoryIdByCode("DOI_TUONG")
                ? "tw-bg-[#14395f] tw-text-white"
                : "tw-bg-white tw-text-slate-600 tw-border tw-border-slate-200"
            }`}
          >
            Thông tin theo đối tượng
          </button>

          {/* Bệnh */}
          <button
            onClick={() =>
              onChangeFilter("category", findCategoryIdByCode("BENH"))
            }
            className={`tw-px-4 tw-py-2 tw-rounded-xl tw-text-sm tw-font-medium ${
              filters.category === findCategoryIdByCode("BENH")
                ? "tw-bg-[#14395f] tw-text-white"
                : "tw-bg-white tw-text-slate-600 tw-border tw-border-slate-200"
            }`}
          >
            Bệnh
          </button>
        </div>

        <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-[1.1fr,0.9fr] tw-gap-6">
          {/* LIST BÀI */}
          <div className="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-overflow-hidden">
            <div className="tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-3 tw-border-b tw-border-slate-100">
              <p className="tw-text-slate-700 tw-font-medium">
                Bài viết của bạn
              </p>
              <select
                value={filters.status}
                onChange={(e) => onChangeFilter("status", e.target.value)}
                className="tw-border tw-rounded-lg tw-px-3 tw-py-1 tw-text-sm"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="draft">Nháp</option>
                <option value="pending">Chờ duyệt</option>
                <option value="published">Đã xuất bản</option>
                <option value="rejected">Từ chối</option>
              </select>
            </div>

            {loading ? (
              <div className="tw-p-10 tw-text-center tw-text-slate-400">
                Đang tải...
              </div>
            ) : articles.length === 0 ? (
              <div className="tw-p-10 tw-text-center tw-text-slate-400">
                Chưa có bài phù hợp bộ lọc
              </div>
            ) : (
              <ul className="tw-divide-y tw-divide-slate-100">
                {articles.map((a) => (
                  <li
                    key={a.id}
                    className="tw-px-4 tw-py-4 tw-flex tw-gap-4 hover:tw-bg-slate-50"
                  >
                    {/* thumbnail giả */}
                    <div className="tw-w-28 tw-h-20 tw-rounded-lg tw-overflow-hidden tw-flex-shrink-0 tw-bg-gradient-to-br tw-from-cyan-100 tw-to-blue-100 tw-flex tw-items-center tw-justify-center">
                      <span className="tw-text-xs tw-text-slate-700">
                        {a.visibility === "multimedia" ? "MM" : "IMG"}
                      </span>
                    </div>

                    <div className="tw-flex-1 tw-min-w-0">
                      <div className="tw-flex tw-items-center tw-gap-2">
                        <h3 className="tw-font-semibold tw-text-slate-900 tw-truncate">
                          {a.title}
                        </h3>
                        {renderStatus(a.status)}
                      </div>
                      <p className="tw-text-xs tw-text-slate-400 tw-mt-1">
                        {a.categoryName || "—"} •{" "}
                        {a.authorName ? `BS: ${a.authorName}` : "Chưa gán bác sĩ"}
                      </p>
                      {a.summary ? (
                        <p className="tw-text-sm tw-text-slate-600 tw-mt-2 tw-line-clamp-2">
                          {a.summary}
                        </p>
                      ) : null}
                    </div>

                    <div className="tw-flex tw-flex-col tw-gap-2">
                      {(a.status === "draft" || a.status === "rejected") && (
                        <button
                          onClick={() => openEdit(a)}
                          className="tw-text-[#14395f] tw-bg-slate-100 tw-px-3 tw-py-1 tw-rounded-lg tw-text-sm"
                        >
                          Sửa
                        </button>
                      )}
                      {a.status === "draft" && (
                        <button
                          onClick={() => handleSubmitArticle(a.id)}
                          className="tw-text-emerald-700 tw-bg-emerald-50 tw-px-3 tw-py-1 tw-rounded-lg tw-text-sm"
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

          {/* CỘT PHẢI */}
          <div className="tw-space-y-4">
            {/* Preview giống khách */}
            <div className="tw-bg-[#062b4f] tw-rounded-2xl tw-p-4 tw-text-white">
              <p className="tw-text-xs tw-uppercase tw-mb-2">Xem trước (giống trang khách)</p>
              <div className="tw-bg-white tw-rounded-xl tw-overflow-hidden tw-flex tw-gap-4">
                {/* không dùng bg-url để tránh lỗi */}
                <div className="tw-w-28 tw-h-28 tw-bg-gradient-to-b tw-from-sky-200 tw-to-white tw-flex-shrink-0"></div>
                <div className="tw-py-3 tw-pr-3 tw-flex-1">
                  <p className="tw-text-xs tw-font-semibold tw-text-pink-500">
                    {form.visibility === "multimedia"
                      ? "MULTIMEDIA"
                      : form.visibility === "featured"
                      ? "FEATURED"
                      : "ARTICLE"}
                  </p>
                  <h4 className="tw-text-lg tw-font-semibold tw-text-slate-900 tw-line-clamp-2">
                    {form.title || "Tiêu đề bài viết sẽ hiển thị ở đây"}
                  </h4>
                  <p className="tw-text-sm tw-text-slate-500 tw-line-clamp-2">
                    {form.summary || "Mô tả ngắn / trích đoạn nội dung."}
                  </p>
                </div>
              </div>
            </div>

            {/* Khối nhắc trạng thái */}
            <div className="tw-bg-white tw-rounded-2xl tw-p-4 tw-shadow-sm">
              <h3 className="tw-text-sm tw-font-semibold tw-mb-3">Trạng thái biên tập</h3>
              <div className="tw-flex tw-gap-3">
                <div className="tw-flex-1 tw-bg-slate-50 tw-rounded-lg tw-p-3">
                  <p className="tw-text-xs tw-text-slate-400">Nháp</p>
                  <p className="tw-text-2xl tw-font-bold tw-text-slate-700">
                    {articles.filter((a) => a.status === "draft").length}
                  </p>
                </div>
                <div className="tw-flex-1 tw-bg-amber-50 tw-rounded-lg tw-p-3">
                  <p className="tw-text-xs tw-text-amber-400">Chờ duyệt</p>
                  <p className="tw-text-2xl tw-font-bold tw-text-amber-600">
                    {articles.filter((a) => a.status === "pending").length}
                  </p>
                </div>
                <div className="tw-flex-1 tw-bg-emerald-50 tw-rounded-lg tw-p-3">
                  <p className="tw-text-xs tw-text-emerald-400">Đã xuất bản</p>
                  <p className="tw-text-2xl tw-font-bold tw-text-emerald-600">
                    {articles.filter((a) => a.status === "published").length}
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            {showForm && (
              <div className="tw-bg-white tw-rounded-2xl tw-p-4 tw-shadow-sm">
                <div className="tw-flex tw-justify-between tw-items-center tw-mb-3">
                  <h2 className="tw-text-base tw-font-semibold">
                    {editing ? "Sửa bài viết" : "Tạo bài viết"}
                  </h2>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditing(null);
                      setForm(emptyForm);
                    }}
                    className="tw-text-slate-400 hover:tw-text-slate-700"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={saveArticle} className="tw-space-y-3">
                  <div>
                    <label className="tw-block tw-text-sm tw-mb-1">Tiêu đề</label>
                    <input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2"
                      required
                    />
                  </div>
                  <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                    <div>
                      <label className="tw-block tw-text-sm tw-mb-1">Danh mục</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2"
                      >
                        <option value="">-- Chọn --</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="tw-block tw-text-sm tw-mb-1">Kiểu hiển thị</label>
                      <select
                        value={form.visibility}
                        onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                        className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2"
                      >
                        <option value="normal">Bình thường</option>
                        <option value="featured">Nổi bật (thẻ to)</option>
                        <option value="multimedia">Multimedia (khối xanh)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="tw-block tw-text-sm tw-mb-1">Tóm tắt</label>
                    <textarea
                      rows={2}
                      value={form.summary}
                      onChange={(e) => setForm({ ...form, summary: e.target.value })}
                      className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2"
                    />
                  </div>
                  <div>
                    <label className="tw-block tw-text-sm tw-mb-1">Nội dung</label>
                    <textarea
                      rows={5}
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2 tw-font-mono"
                      required
                    />
                  </div>
                  <div className="tw-flex tw-justify-end tw-gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditing(null);
                        setForm(emptyForm);
                      }}
                      className="tw-border tw-border-slate-200 tw-rounded-lg tw-px-4 tw-py-2"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="tw-bg-[#14395f] tw-text-white tw-rounded-lg tw-px-4 tw-py-2"
                    >
                      Lưu
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Nếu chưa mở form */}
            {!showForm && (
              <div className="tw-bg-white tw-rounded-2xl tw-p-4 tw-shadow-sm">
                <p className="tw-text-sm tw-text-slate-500">
                  Chọn 1 bài ở danh sách bên trái để chỉnh sửa hoặc bấm “+ Bài mới”.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
