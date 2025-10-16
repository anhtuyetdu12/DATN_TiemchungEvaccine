import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/axios";

export default function DetailsPackage() {
  const { slug } = useParams();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get(`/vaccines/packages/${slug}/`);
        mounted && setPkg(res.data);
      } finally { mounted && setLoading(false); }
    })();
    return () => (mounted = false);
  }, [slug]);

  if (loading) return <div className="tw-py-20 tw-text-center">Đang tải…</div>;
  if (!pkg) return <div className="tw-py-20 tw-text-center">Không tìm thấy gói vắc xin.</div>;

  return (
    <section className="tw-max-w-[1100px] tw-mx-auto tw-px-5 tw-py-[150px]">
      <div className="tw-bg-white tw-rounded-2xl tw-shadow-md tw-p-8 tw-mb-8">
        <div className="tw-flex tw-gap-8">
          <div className="tw-w-1/3">
            <img src={pkg.image || "/images/no-image.jpg"} alt={pkg.name} className="tw-rounded-xl tw-shadow tw-w-full tw-object-contain" />
          </div>
          <div className="tw-w-2/3 tw-text-left tw-space-y-4">
            <h1 className="tw-text-[30px] tw-font-semibold">{pkg.name}</h1>
            <p className="tw-text-gray-600">{pkg.description || "—"}</p>
          </div>
        </div>
      </div>

      <div className="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-p-6">
        <h3 className="tw-text-2xl tw-font-semibold tw-mb-4">Chi tiết gói</h3>
        <div className="tw-space-y-6">
          {(pkg.disease_groups || []).map((g) => (
            <div key={g.id} className="tw-border-b tw-border-dashed tw-pb-4">
              <p className="tw-font-semibold tw-text-lg tw-mb-2">{g.disease?.name}</p>
              <div className="tw-grid tw-gap-3">
                {(g.vaccines || []).map((v) => (
                  <div key={v.id} className="tw-flex tw-items-center tw-justify-between tw-bg-gray-50 tw-rounded-xl tw-p-3">
                    <div className="tw-flex tw-items-center tw-gap-3">
                      <img src={v.image || "/images/no-image.jpg"} alt={v.name} className="tw-w-14 tw-h-14 tw-object-cover tw-rounded-lg" />
                      <div className="tw-text-left">
                        <p className="tw-font-medium">{v.name}</p>
                        <p className="tw-text-gray-500">{v.disease?.name}</p>
                      </div>
                    </div>
                    <div className="tw-text-right">
                      <p className="tw-text-[#fd8206] tw-font-semibold">
                        {v.price != null ? `${Number(v.price).toLocaleString("vi-VN")} VNĐ` : "—"}
                      </p>
                      {v.doses_required ? <p className="tw-text-gray-500">{v.doses_required} liều</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
