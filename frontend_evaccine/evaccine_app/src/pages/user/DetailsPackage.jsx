import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../services/axios";

export default function DetailsPackage() {
  const { slug } = useParams(); const navigate = useNavigate();
  const [pkg, setPkg] = useState(null); const [loading, setLoading] = useState(true);
  const [activeGroupId, setActiveGroupId] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get(`/vaccines/packages/${slug}/`);
        if (!mounted) return;
        setPkg(res.data);
        const firstGroup = res.data?.disease_groups?.find(g => (g?.vaccines || []).length > 0);
        setActiveGroupId(firstGroup?.id ?? null);
      } finally { mounted && setLoading(false); }
    })();
    return () => (mounted = false);
  }, [slug]);

  const groups = useMemo(() => pkg?.disease_groups || [], [pkg]);
  const activeGroup = useMemo(() => groups.find(g => g.id === activeGroupId) || groups[0], [groups, activeGroupId]);

  if (loading) return <div className="tw-py-20 tw-text-center">Đang tải…</div>;
  if (!pkg) return <div className="tw-py-20 tw-text-center">Không tìm thấy gói.</div>;

  const handleBack = () => {
    // nếu có lịch sử thì quay lại, không thì về danh sách
    if (window.history.length > 1) navigate(-1);
    else navigate("/vaccines");
  };

  return (
    <section className="tw-bg-white tw-pt-[120px] tw-pb-[60px] tw-px-10 tw-text-center">
      <div className="tw-flex tw-justify-start tw-mb-4 tw-ml-10">
        <button onClick={handleBack} aria-label="Quay lại"
          className="tw-inline-flex tw-items-center tw-gap-2 tw-text-blue-600 hover:tw-text-blue-800
                    tw-bg-white tw-border tw-border-blue-200 hover:tw-border-blue-400
                    tw-rounded-full tw-px-4 tw-py-2 tw-shadow-sm" >
          <i className="fa-solid fa-arrow-left"></i>
          <span className="tw-font-medium">Quay lại</span>
        </button>
      </div>
      <div className="tw-max-w-[1100px] tw-mx-auto tw-flex tw-items-center tw-justify-center tw-gap-6 tw-mb-8">
        {pkg?.image && (
          <img src={pkg.image} alt={pkg.name} className="tw-w-[90px] tw-h-[90px] tw-object-contain tw-rounded-xl tw-shadow" />
        )}
        <div className="tw-text-left">
          <h2 className="tw-text-[32px] md:tw-text-[38px] tw-font-bold tw-mb-2 tw-text-center">
            <span className="tw-text-orange-500 tw-italic">{pkg?.name}</span>
            <i className="fa fa-heart tw-text-red-500 tw-ml-4 tw-text-[20px]"></i>
          </h2>
          {pkg?.description && <p className="tw-text-gray-600 tw-max-w-[800px] tw-text-justify">{pkg.description}</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="tw-flex tw-justify-center tw-gap-[10px] tw-flex-wrap tw-mb-5">
        {(groups.length ? groups : [{ id: "none", disease: { name: "Danh mục" }, vaccines: [] }]).map(g => (
          <button  key={g.id}  onClick={() => setActiveGroupId(g.id)}
            className={`tw-transition-all tw-duration-300 tw-font-medium
              ${ (activeGroupId ?? groups[0]?.id) === g.id
                  ? ` tw-px-[22px] tw-py-[10px] tw-rounded-[30px] tw-bg-gradient-to-r tw-from-[#4facfe] tw-to-[#00f2fe]
                    tw-text-[13px] tw-font-semibold tw-text-white tw-shadow-[0px_4px_12px_rgba(0,0,0,0.15)]
                    hover:-tw-translate-y-1 hover:tw-to-[#0061ff] hover:tw-from-[#00c6ff] `
                  : ` tw-py-[10px] tw-px-[18px] tw-border tw-rounded-[30px] tw-font-medium tw-bg-white tw-text-black tw-border-gray-300
                    hover:tw-border-[#54affa] hover:tw-text-[#54affa] `
              }`}>
            {g?.disease?.name}
          </button>
        ))}
      </div>

      {/* Nội dung */}
      <div className="tw-max-w-[1200px] tw-min-h-[400px] tw-border-2 tw-border-[#34b4ed] tw-rounded-2xl tw-flex tw-overflow-hidden tw-mx-auto">
        <div className="tw-flex-1 tw-bg-gradient-to-br tw-from-[#34b4ed] tw-to-[#0666f7] tw-text-white tw-p-[25px] tw-text-left">
          <h3 className="tw-font-bold tw-mb-3 tw-text-[22px]">
            <span className="tw-text-[44px] tw-mr-2">💉</span>{activeGroup?.disease?.name}
          </h3>
          <p className="tw-pt-[10px] tw-leading-[1.6] tw-text-justify tw-text-white">
            {activeGroup?.disease?.description || "Danh mục vắc xin thuộc gói. Lướt để xem chi tiết."}
          </p>
        </div>

        <div className="tw-w-[60%] tw-flex tw-gap-4 tw-p-[20px] tw-bg-gradient-to-br tw-from-[#0666f7] tw-to-[#34b4ed] tw-overflow-x-auto tw-scroll-smooth tw-whitespace-nowrap
          [&::-webkit-scrollbar]:tw-h-3 [&::-webkit-scrollbar-thumb]:tw-rounded-full">
          {(activeGroup?.vaccines || []).map(v => (
            <div key={v.id} className="tw-flex-none tw-w-[230px] tw-h-[360px] tw-bg-white tw-rounded-xl tw-p-[15px] tw-shadow-md tw-flex tw-flex-col tw-justify-between tw-text-center">
              <span className="tw-text-sm tw-font-semibold tw-uppercase tw-text-blue-500"> {v?.origin ? ` ${v.origin}` : ""} </span>
              <img src={v.image || "/images/no-image.jpg"} alt={v.name} className="tw-w-full tw-max-h-[120px] tw-object-contain tw-my-[10px]" />
              <h4 className="tw-font-bold tw-text-[16px] tw-line-clamp-2">{v.name}</h4>
              <p className="tw-text-gray-600">{v?.disease?.name}</p>
              <p className="tw-font-bold tw-text-[#ff6600]">
                {v?.price != null ? `${Number(v.price).toLocaleString("vi-VN")} VNĐ / ${ v?.unit || "liều" }` : "Liên hệ"}
              </p>

              <div className="tw-flex tw-gap-2 tw-justify-center">
                <Link to={v?.slug ? `/vaccines/${v.slug}` : "#"}
                  className="tw-bg-[#ffedcc] tw-text-[#ff6600] tw-font-medium tw-py-2 tw-px-8 tw-rounded-full hover:tw-bg-[#ff6600] hover:tw-text-white" >
                  Xem chi tiết
                </Link>
                <button  onClick={() => navigate("/bookingform", { state: { vaccineId: v.id } })}
                  className="tw-bg-[#abe0ff] tw-text-[#3267fa] tw-font-medium tw-py-2 tw-px-8 tw-rounded-full hover:tw-bg-[#3267fa] hover:tw-text-white" >
                  Đặt hẹn
                </button>
              </div>
            </div>
          ))}

          {(!activeGroup || (activeGroup?.vaccines || []).length === 0) && (
            <div className="tw-flex tw-items-center tw-justify-center tw-w-full tw-text-white tw-opacity-90">
              Chưa có vắc xin cho danh mục này.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
