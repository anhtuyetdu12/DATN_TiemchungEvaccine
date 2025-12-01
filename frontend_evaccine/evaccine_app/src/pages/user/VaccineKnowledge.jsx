// src/pages/VaccineKnowledge.jsx
import React, { useEffect, useState } from "react";
import { getKnowledgeCategories, getPublicKnowledgeArticles,} from "../../services/knowledgeService";
import KnowledgeQuickViewModal from "../user/modal/knowledge/KnowledgeQuickViewModal";

export default function VaccineKnowledge() {
  const [categories, setCategories] = useState([]);
  const [articlesByCategory, setArticlesByCategory] = useState({});
  const [featured, setFeatured] = useState(null);
  const [activeCatId, setActiveCatId] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");


  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // 1. Danh mục active
        const cats = await getKnowledgeCategories();
        const activeCats = (cats || []).filter((c) => c.isActive);

        // 2. Lấy featured + all public
        const [featuredList, latestAll] = await Promise.all([
          getPublicKnowledgeArticles({ visibility: "featured", limit: 10 }),
          getPublicKnowledgeArticles({ limit: 80 }),
        ]);

        // 3. Lấy bài theo từng danh mục (chuẩn theo backend public)
        const catEntries = await Promise.all(
          activeCats.map(async (cat) => {
            const items = await getPublicKnowledgeArticles({
              category: cat.id,
              limit: 30,
            });
            return [cat.id, items];
          })
        );

        const byCat = {};
        catEntries.forEach(([id, items]) => {
          byCat[id] = items;
        });

        // Hero: ưu tiên featured, nếu không có thì lấy bài mới nhất
        const hero =
          (featuredList && featuredList[0]) ||
          (latestAll && latestAll[0]) ||
          null;

        setCategories(activeCats);
        setArticlesByCategory(byCat);
        setFeatured(hero);
        setActiveCatId(activeCats[0]?.id || null);
      } catch (err) {
        console.error("Load VaccineKnowledge failed", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const renderShort = (text = "", len = 120) => {
    if (!text) return "";
    return text.length > len ? text.slice(0, len - 3) + "..." : text;
  };

  const renderDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const totalArticles = Object.values(articlesByCategory).reduce(
    (acc, arr) => acc + (arr?.length || 0),
    0
  );

  const activeArticles = activeCatId ? articlesByCategory[activeCatId] || [] : [];

  const filteredArticles = activeArticles.filter((a) => {
    if (!searchQuery.trim()) return true;
    const keyword = searchQuery.toLowerCase();
    return (
      a.title?.toLowerCase().includes(keyword) ||
      a.summary?.toLowerCase().includes(keyword) ||
      a.content?.toLowerCase().includes(keyword)
    );
  });

  const getInitials = (title = "") => {
    const parts = title.trim().split(" ");
    if (parts.length === 0) return "KV";
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "K";
    return (
      (parts[0][0] || "").toUpperCase() +
      (parts[parts.length - 1][0] || "").toUpperCase()
    );
  };

  const applySearch = () => { setSearchQuery(searchInput.trim()); };
  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") { applySearch(); }
  };
  const handleClearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
  };

  return (
    <div>
      <section className="tw-min-h-screen tw-pt-10 tw-pb-16 tw-bg-[radial-gradient(circle_at_top,_#f9fafb_0%,_#eff6ff_40%,_#ffffff_100%)]">
        <div className="tw-max-w-[1200px] tw-mx-auto tw-px-4 md:tw-px-6 tw-mt-[90px] tw-space-y-8">
          <header className="tw-flex tw-flex-col md:tw-flex-row tw-items-start md:tw-items-center tw-justify-between tw-gap-4">
            <div className="tw-flex-1 tw-max-w-[520px] tw-text-center">
              <h3 className="tw-text-[30px] md:tw-text-[32px] tw-font-extrabold tw-mt-1 tw-py-3
                          tw-bg-gradient-to-r tw-from-sky-600 tw-via-blue-500 tw-to-pink-500
                          tw-text-transparent tw-bg-clip-text ">
                Góc Kiến Thức Tiêm Chủng
              </h3>
              <p className="tw-text-[11px] tw-md:text-sm tw-text-slate-600 tw-mt-2 tw-max-w-[520px]">
                Một “feed” những bài viết ngắn gọn, rõ ràng, có hình minh hoạ,
                giúp bạn hiểu nhanh về vaccine, lịch tiêm và an toàn tiêm chủng.
                Nội dung được biên soạn & duyệt bởi đội ngũ chuyên môn.
              </p>
            </div>

            <div className="tw-flex tw-flex-col tw-items-end tw-gap-1 tw-w-full md:tw-w-[280px] lg:tw-w-[340px]">
              <div className="tw-flex tw-items-center tw-gap-2">
                <div className="tw-w-7 tw-h-7 tw-rounded-full tw-bg-gradient-to-tr tw-from-pink-500 tw-to-sky-400 tw-flex tw-items-center 
                  tw-justify-center tw-text-[9px] tw-font-semibold tw-text-white">
                  KV
                </div>
                <span className="tw-text-[10px] tw-text-slate-500"> Nội dung đã kiểm duyệt </span>
              </div>
              <div className="tw-flex tw-items-baseline tw-gap-3">
                <span className="tw-text-[12px] tw-font-bold tw-text-slate-900">
                  {totalArticles}
                </span>
                <span className="tw-text-[9px] tw-text-slate-500">
                  bài viết • {categories.length} danh mục
                </span>
              </div>
              <div className="tw-mt-4 tw-w-full">
                <div className="tw-relative tw-w-full">
                  {/* Icon search (bấm = áp dụng tìm kiếm) */}
                  <button type="button" onClick={applySearch}
                    className="tw-absolute tw-inset-y-0 tw-left-3 tw-flex tw-items-center tw-text-blue-500 hover:tw-text-blue-600 tw-transition">
                    <i className="fa-solid fa-magnifying-glass tw-text-[13px]"></i>
                  </button>
                  <input  type="text"  placeholder="Tìm kiếm bài viết..."
                    className="tw-w-full tw-pl-9 tw-pr-9 tw-py-2 tw-text-xl tw-rounded-xl tw-border tw-border-sky-300
                      focus:tw-outline-none focus:tw-border-[#1999ee] focus:tw-ring-2 focus:tw-ring-[#1999ee]/40 tw-bg-white tw-text-gray-700"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                  />
                  {searchInput && (
                    <button type="button"  onClick={handleClearSearch}
                      className="tw-absolute tw-inset-y-0 tw-right-3 tw-flex tw-items-center tw-text-red-500 hover:tw-text-red-600 tw-transition">
                     <i className="fa-solid fa-xmark tw-text-[12px]"></i>
                    </button>
                  )}
                </div>
              </div>

            </div>
          </header>


          {/* FEATURED HERO CARD (như top post) */}
          {featured && (
            <div className="tw-relative tw-rounded-3xl tw-overflow-hidden tw-bg-slate-900 tw-text-white tw-p-4 md:tw-p-5 tw-flex tw-gap-4 
                tw-items-stretch tw-shadow-md tw-border tw-border-slate-800/60">
              <div className="tw-w-24 tw-h-24 md:tw-w-32 md:tw-h-32 tw-rounded-2xl tw-overflow-hidden tw-bg-slate-800 tw-flex-shrink-0">
                {featured.thumbnail ? (
                  <img  src={featured.thumbnail}  alt={featured.title} className="tw-w-full tw-h-full tw-object-cover" />
                ) : (
                  <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-text-[18px] tw-font-semibold tw-bg-gradient-to-br tw-from-sky-500 tw-to-pink-500">
                    {getInitials(featured.title)}
                  </div>
                )}
              </div>
              <div className="tw-flex-1 tw-flex tw-flex-col tw-min-w-0">
                <div className="tw-flex tw-items-center tw-gap-2 tw-text-[9px] tw-text-sky-300 tw-mb-1">
                  <span className="tw-uppercase tw-tracking-[0.18em]">
                    Bài nổi bật
                  </span>
                  <span className="tw-w-1 tw-h-1 tw-rounded-full tw-bg-sky-400" />
                  <span>{renderDate(featured.publishedAt)}</span>
                  {featured.categoryName && (
                    <>
                      <span className="tw-w-1 tw-h-1 tw-rounded-full tw-bg-sky-400" />
                      <span>{featured.categoryName}</span>
                    </>
                  )}
                </div>
                <h2 className="tw-text-[15px] md:tw-text-[17px] tw-font-semibold tw-leading-snug tw-line-clamp-2">
                  {featured.title}
                </h2>
                <p className="tw-text-[10px] tw-text-slate-200 tw-mt-1 tw-line-clamp-3">
                  {renderShort(featured.summary || featured.content, 180)}
                </p>
                <div className="tw-flex  tw-gap-1.5 tw-mt-2 tw-overflow-hidden tw-truncate tw-max-w-full">
                  {featured.disease && (
                    <span className="tw-text-[8px] tw-px-2 tw-py-0.5 tw-rounded-full tw-bg-sky-500/20 tw-text-sky-200">
                      #{featured.disease}
                    </span>
                  )}
                  {featured.vaccine && (
                    <span className="tw-text-[8px] tw-px-2 tw-py-0.5 tw-rounded-full tw-bg-pink-500/20 tw-text-pink-100">
                      #{featured.vaccine}
                    </span>
                  )}
                  <button  onClick={() => setSelectedArticle(featured)}
                    className="tw-ml-auto tw-text-[9px] tw-px-3 tw-py-1 tw-rounded-full tw-bg-white tw-text-slate-900 tw-font-semibold hover:tw-bg-slate-100 tw-transition">
                    Đọc nhanh
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY CHIPS (như IG stories filter) */}
          {categories.length > 0 && (
            <div className="tw-flex tw-overflow-x-auto tw-gap-2 tw-pt-1 tw-pb-2 tw-no-scrollbar">
              {categories.map((cat) => {
                const active = cat.id === activeCatId;
                return (
                  <button  key={cat.id}  onClick={() => setActiveCatId(cat.id)}
                    className={`tw-flex tw-items-center tw-gap-1.5 tw-px-3 tw-py-1.5 tw-rounded-full tw-text-[10px] tw-border tw-whitespace-nowrap tw-transition
                      ${  active
                          ? "tw-bg-gradient-to-r tw-from-sky-600 tw-to-pink-500 tw-text-white tw-border-transparent tw-shadow-sm"
                          : "tw-bg-white tw-text-slate-600 tw-border-slate-200 hover:tw-bg-slate-50"
                      }`}>
                    <span className="tw-w-5 tw-h-5 tw-rounded-full tw-bg-slate-100 tw-flex tw-items-center tw-justify-center tw-text-[8px] tw-text-slate-500">
                      {cat.name[0]?.toUpperCase()}
                    </span>
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* GRID BÀI VIẾT: INSTAGRAM-STYLE CARD FEED */}
          {!loading && activeCatId && (
            <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-4 tw-gap-4 tw-mt-2">
             {filteredArticles.length === 0 ? (
                <div className="tw-col-span-4 tw-bg-white tw-rounded-2xl tw-p-6 tw-text-sm tw-text-slate-500 tw-text-center tw-shadow-sm">
                  {activeArticles.length === 0
                    ? "Chưa có bài viết trong danh mục này."
                    : "Không tìm thấy bài viết phù hợp với từ khoá tìm kiếm."}
                </div>
                ) : (
                filteredArticles.map((a) => (
                  <article key={a.id} onClick={() => setSelectedArticle(a)}
                    className="tw-group tw-bg-white tw-rounded-2xl tw-overflow-hidden tw-shadow-sm tw-border tw-border-slate-100 tw-cursor-pointer tw-flex tw-flex-col 
                    tw-transition hover:tw-shadow-lg hover:tw-border-sky-200 hover:tw-translate-y-0.5">
                    <div className="tw-relative tw-w-full tw-h-[200px] md:tw-h-[250px] tw-bg-slate-100 tw-overflow-hidden">
                      {a.thumbnail ? (
                        <img  src={a.thumbnail}  alt={a.title}
                          className="tw-w-full tw-h-full tw-object-cover tw-transition group-hover:tw-scale-105"
                        />
                      ) : (
                        <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-bg-gradient-to-br tw-from-sky-100 tw-via-white tw-to-pink-100">
                          <span className="tw-text-[16px] tw-font-semibold tw-text-slate-500">
                            {getInitials(a.title)}
                          </span>
                        </div>
                      )}
                      {a.visibility === "featured" && (
                        <span className="tw-absolute tw-top-2 tw-right-2 tw-text-[8px] tw-px-2 tw-py-0.5 tw-rounded-full tw-bg-black/70 tw-text-white">
                          Nổi bật
                        </span>
                      )}
                    </div>

                    {/* Nội dung ngắn gọn */}
                    <div className="tw-px-3 tw-pt-2 tw-pb-3 tw-flex tw-flex-col tw-gap-1 tw-flex-1">
                      <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
                        <span className="tw-text-[8px] tw-text-slate-400">
                          {renderDate(a.publishedAt)}
                        </span>
                        {a.categoryName && (
                          <span className="tw-text-[8px] tw-text-sky-500 tw-font-medium tw-truncate">
                            {a.categoryName}
                          </span>
                        )}
                      </div>
                      <h3 className="tw-text-[11px] tw-font-semibold tw-text-slate-900 tw-line-clamp-2">
                        {a.title}
                      </h3>
                      <p className="tw-text-[9px] tw-text-slate-600 tw-line-clamp-3">
                        {renderShort(a.summary || a.content, 90)}
                      </p>
                      <div className="tw-flex tw-gap-1 tw-max-w-full">
                        {a.disease && (
                          <span className=" tw-flex-1  tw-text-[8px] tw-px-1.5 tw-py-0.5 tw-rounded-full 
                              tw-bg-sky-50 tw-text-sky-700 tw-overflow-hidden tw-text-ellipsis tw-whitespace-nowrap " >
                            #{a.disease}
                          </span>
                        )}

                        {a.vaccine && (
                          <span className=" tw-flex-1 tw-text-[8px] tw-px-1.5 tw-py-0.5 tw-rounded-full  tw-bg-emerald-50 tw-text-emerald-700
                              tw-overflow-hidden tw-text-ellipsis tw-whitespace-nowrap ">
                            #{a.vaccine}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          )}

          {!loading && (!activeCatId || totalArticles === 0) && (
            <div className="tw-text-center tw-text-slate-500 tw-text-sm tw-mt-8"> Chưa có bài viết kiến thức được xuất bản.</div>
          )}

          {loading && (
            <div className="tw-text-center tw-text-slate-500 tw-text-sm tw-mt-4">  Đang tải nội dung kiến thức tiêm chủng... </div>
          )}
        </div>
      </section>

      {selectedArticle && (
        <KnowledgeQuickViewModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}


    </div>
  );
}
