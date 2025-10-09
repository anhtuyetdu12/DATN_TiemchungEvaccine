// kien thuc tiem chung

export default function VaccineKnowledge() {
    return (
        <div>
            <section className="tw-bg-white tw-pt-10 tw-pb-20  tw-min-h-screen 
                   tw-bg-[radial-gradient(circle_at_center,_#bfdbfe_0%,_white_80%)]" >
                <div className="tw-max-w-[1200px] tw-mx-auto tw-px-6 tw-container tw-mt-[100px]">
                <div className="tw-container tw-mx-auto tw-px-6 lg:tw-px-14">
                        
                    {/* Tiêu đề */}
                   <h1 className="tw-text-[40px] tw-font-bold tw-mb-10 tw-pb-5
                                tw-bg-gradient-to-b tw-from-pink-500 tw-via-purple-500 tw-to-blue-500 
                                tw-text-transparent tw-bg-clip-text tw-text-center">
                    Kiến thức tiêm chủng
                    </h1>

                    {/* Đội ngũ chuyên môn */}
                    <div className="tw-flex tw-items-left  tw-mb-6">
                        <h3 className="tw-text-2xl tw-font-semibold tw-text-gray-800 tw-flex tw-items-center">
                            <span className="tw-text-pink-500 tw-mr-2">✨</span>
                            ĐỘI NGŨ CHUYÊN MÔN
                        </h3>
                        <div className="tw-border-l-2 tw-border-gray-300 tw-h-8 tw-mx-6"></div>

                        <button  type="button" className="tw-text-blue-500 tw-text-lg hover:tw-underline  tw-flex tw-items-center" >
                            Xem tất cả
                            <i className="fa-solid fa-angles-right tw-pl-3"></i>
                        </button>
                    </div>

                    <div className="tw-bg-[#14395f] tw-py-10 tw-my-[10px] tw-rounded-xl">
                        <div className="tw-max-w-[1000px] tw-mx-auto px-6 tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-20 tw-items-start tw-text-left ">
                        
                            <div className="tw-flex tw-items-center tw-space-x-4 ">
                                <div className="tw-flex-shrink-0">
                                    <img src="/images/bs7.jpg" alt="Bác sĩ" className ="tw-w-24 tw-h-24 tw-rounded-full tw-object-cover"/>                               
                                </div>
                                <div>
                                    <p className="tw-font-semibold tw-text-white">Lê Thị Giao Thi</p>
                                    <p className="tw-text-lg tw-text-white">Y học gia đình</p>
                                </div>
                            </div>

                            <div className="tw-flex tw-items-center tw-space-x-4">
                                <div className="tw-flex-shrink-0">
                                    <img src="/images/bs2.jpg" alt="Bác sĩ" className="tw-w-24 tw-h-24 tw-rounded-full tw-object-cover"/>
                                </div>
                                <div>
                                    <p className="tw-font-semibold tw-text-white">Trần Anh Tuấn</p>
                                    <p className="tw-text-lg tw-text-white">Chuẩn đoán hình ảnh</p>
                                </div>
                            </div>

                            <div className="tw-flex tw-items-center tw-space-x-4">
                                <div className="tw-flex-shrink-0">
                                    <img src="/images/bs8.jpg" alt="Bác sĩ" className="tw-w-24 tw-h-24 tw-rounded-full tw-object-cover"/>
                                </div>
                                <div>
                                    <p className="tw-font-semibold tw-text-white">Phạm Thị Khánh Vy</p>
                                    <p className="tw-text-lg tw-text-white">Sản phụ khoa</p>
                                </div>
                            </div>

                            <div className="tw-flex tw-items-center tw-space-x-4">
                                <div className="tw-flex-shrink-0">
                                    <img src="/images/bs6.jpg" alt="Bác sĩ" className="tw-w-24 tw-h-24 tw-rounded-full tw-object-cover"/>
                                </div>
                                <div>
                                    <p className="tw-font-semibold tw-text-white">Nguyễn Minh Hiếu</p>
                                    <p className="tw-text-lg tw-text-white">Truyền nhiễm</p>
                                </div>
                            </div>

                        </div>
                    </div>

                        
                   

                    {/* Multimedia */}
                    <div className="tw-bg-[#062b4f] tw-rounded-2xl tw-p-6 tw-mt-10">
                    {/* Tabs */}
                        <div className="tw-flex tw-gap-6 tw-text-white tw-mb-6">
                            <span className="tw-font-semibold tw-border-b-2 tw-border-pink-400 tw-pb-2">MULTIMEDIA</span>
                            <span className="hover:tw-text-pink-400 tw-cursor-pointer">Video</span>
                            <span className="hover:tw-text-pink-400 tw-cursor-pointer">LongForm</span>
                            <span className="hover:tw-text-pink-400 tw-cursor-pointer">Trắc nghiệm sức khỏe</span>
                        </div>

                        {/* Nội dung */}
                        <div className="tw-grid tw-grid-cols-4 tw-gap-4">
                            {/* Cột trái */}
                            <div className="tw-col-span-1 tw-bg-white tw-rounded-xl tw-overflow-hidden ">
                                <img src="/images/mda1.jpg" alt="media" className="tw-w-full tw-h-[260px] tw-object-cover"/>
                                <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-text-center tw-p-4">
                                    <p className="tw-text-yellow-500 tw-font-bold tw-text-3xl tw-pb-2">CẢNH BÁO</p>
                                    <h4  className="tw-text-gray-900 tw-text-2xl tw-font-semibold  tw-line-clamp-2 tw-overflow-hidden  tw-[display:-webkit-box] 
                                                tw-[-webkit-line-clamp:2]  tw-[-webkit-box-orient:vertical]" >
                                    Dấu hiệu cơ bản về bệnh sốt xuất huyết cần lưu ý với mọi người.
                                    </h4>
                                </div>
                            </div>

                            {/* Cột giữa */}
                            <div className="tw-col-span-2 tw-bg-white tw-rounded-xl tw-overflow-hidden tw-relative">
                                <img src="/images/mda2.jpg" alt="media2" className="tw-w-full tw-h-[260px] tw-object-cover"/>
                                <span className="tw-absolute tw-top-2 tw-left-2 tw-bg-black tw-text-white tw-text-xs tw-px-2 tw-rounded">Article</span>
                                <div className="tw-p-10 tw-flex tw-items-center tw-justify-center tw-text-center">                          
                                    <div className="tw-flex-1 tw-w-0">
                                        <h4 className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-gray-900
                                                        tw-line-clamp-2 tw-overflow-hidden tw-[display:-webkit-box]
                                                        tw-[-webkit-line-clamp:2] tw-[-webkit-box-orient:vertical]
                                                        tw-break-normal">
                                            Đau thượng vị vào buổi sáng: Nguyên nhân và cách khắc phục 
                                        </h4>
                                    </div>
                                </div>
                            </div>

                            {/* Cột phải */}
                            <div className="tw-col-span-1 tw-flex tw-flex-col tw-gap-6">
                                <div className="tw-bg-white tw-rounded-xl tw-flex tw-gap-2 tw-items-center tw-overflow-hidden ">
                                    <img src="/images/mda3.jpg" alt="mda1" className="tw-w-[100px] tw-h-[80px] tw-object-cover tw-flex-shrink-0"/>
                                    <div className="tw-flex-1 tw-w-0">
                                        <p className="tw-m-0 tw-text-lg tw-font-medium tw-text-gray-900
                                                        tw-line-clamp-2 tw-overflow-hidden tw-[display:-webkit-box]
                                                        tw-[-webkit-line-clamp:2] tw-[-webkit-box-orient:vertical]
                                                        tw-break-normal tw-pr-2">
                                            Tiêm HPV bao nhiêu tiền? Chi phí và địa chỉ uy tín đáng tin cậy
                                        </p>
                                    </div>
                                </div>
                                <div className="tw-bg-white tw-rounded-xl tw-flex tw-gap-2 tw-items-center tw-overflow-hidden ">
                                    <img src="/images/mda4.jpg" alt="mda2" className="tw-w-[100px] tw-h-[80px] tw-object-cover tw-flex-shrink-0"/>
                                    <div className="tw-flex-1 tw-w-0">
                                        <p className="tw-m-0 tw-text-lg tw-font-medium tw-text-gray-900
                                                        tw-line-clamp-2 tw-overflow-hidden tw-[display:-webkit-box]
                                                        tw-[-webkit-line-clamp:2] tw-[-webkit-box-orient:vertical]
                                                        tw-break-normal tw-pr-2">
                                            Lang ben đỏ: Nguyên nhân, triệu chứng và cách phòng chống bệnh lang ben
                                        </p>
                                    </div>
                                </div>
                                <div className="tw-bg-white tw-rounded-xl tw-flex tw-gap-2 tw-items-center tw-overflow-hidden ">
                                    <img src="/images/mda6.jpg" alt="mda3" className="tw-w-[100px] tw-h-[80px] tw-object-cover tw-flex-shrink-0"/>
                                    <div className="tw-flex-1 tw-w-0">
                                        <p className="tw-m-0 tw-text-lg tw-font-medium tw-text-gray-900
                                                        tw-line-clamp-2 tw-overflow-hidden tw-[display:-webkit-box]
                                                        tw-[-webkit-line-clamp:2] tw-[-webkit-box-orient:vertical]
                                                        tw-break-normal tw-pr-2">
                                            Tràn dịch khớp gối có đạp xe được không? Có cách nào hồi phục nhanh hơn
                                        </p>
                                    </div>
                                </div>
                                <div className="tw-bg-white tw-rounded-xl tw-flex tw-gap-2 tw-items-center tw-overflow-hidden">
                                    <img src="/images/mda5.jpg" alt="mda4" className="tw-w-[100px] tw-h-[80px] tw-object-cover tw-flex-shrink-0 "/>
                                    <div className="tw-flex-1 tw-w-0">
                                        <p className="tw-m-0 tw-text-lg tw-font-medium tw-text-gray-900
                                                        tw-line-clamp-2 tw-overflow-hidden tw-[display:-webkit-box]
                                                        tw-[-webkit-line-clamp:2] tw-[-webkit-box-orient:vertical]
                                                        tw-break-normal tw-pr-2">
                                            Cách điều trị tràn dịch khớp gối: Hướng dẫn chăm sóc người bị bệnh tràn dịch khớp gối
                                        </p>
                                    </div>
                                </div>
                                
                            </div>
                        </div>
                    </div>

                    {/* Thông tin sức khỏe */}
                    <div className="tw-mt-12">
                        <div className="tw-flex tw-items-left tw-mb-6">
                            <h3 className="tw-text-2xl tw-font-semibold">Thông tin sức khỏe</h3>
                            <div className="tw-border-l-2 tw-border-gray-300 tw-h-8 tw-mx-6"></div>

                            <button  type="button" className="tw-text-blue-500 tw-text-lg hover:tw-underline  tw-flex tw-items-center" >
                                Xem tất cả
                                <i className="fa-solid fa-angles-right tw-pl-3"></i>
                            </button>
                        </div>
                        <div className="tw-grid tw-grid-cols-4 tw-gap-6">
                            <div className="tw-bg-white tw-rounded-xl tw-p-6 tw-shadow-sm tw-text-center">
                                <img src="/images/icon1.jpg" alt="tin1" className="tw-rounded-full tw-w-20 tw-h-20 tw-mx-auto"/>
                                <p className="tw-font-medium tw-text-lg tw-mt-3">Sức khỏe giới tính</p>
                            </div>
                            <div className="tw-bg-white tw-rounded-xl tw-p-6 tw-shadow-sm tw-text-center">
                                <img src="/images/icon2.jpg" alt="tin2" className="tw-rounded-full tw-w-20 tw-h-20 tw-mx-auto"/>
                                <p className="tw-font-medium tw-text-lg tw-mt-3">Chăm sóc sức khỏe</p>
                            </div>
                            <div className="tw-bg-white tw-rounded-xl tw-p-6 tw-shadow-sm tw-text-center">
                                <img src="/images/icon3.jpg" alt="tin3" className="tw-rounded-full tw-w-20 tw-h-20 tw-mx-auto"/>
                                <p className="tw-font-medium tw-text-lg tw-mt-3">Dinh dưỡng</p>
                            </div>
                            <div className="tw-bg-white tw-rounded-xl tw-p-6 tw-shadow-sm tw-text-center">
                                <img src="/images/icon4.jpg" alt="tin4" className="tw-rounded-full tw-w-20 tw-h-20 tw-mx-auto"/>
                                <p className="tw-font-medium tw-text-lg tw-mt-3">Mẹ & Bé</p>
                            </div>
                        </div>
                    </div>
                     

                    {/* Thông tin vắc xin theo đối tượng */}
                    <div className="tw-mt-12">
                        <div className="tw-flex tw-items-left tw-mb-6">
                            <h3 className="tw-text-2xl tw-font-semibold">Thông tin vắc xin theo Đối tượng</h3>
                            <div className="tw-border-l-2 tw-border-gray-300 tw-h-8 tw-mx-6"></div>

                            <button  type="button" className="tw-text-blue-500 tw-text-lg hover:tw-underline  tw-flex tw-items-center" >
                                Xem tất cả
                                <i className="fa-solid fa-angles-right tw-pl-3"></i>
                            </button>
                        </div>
                        <div className="tw-grid tw-grid-cols-4 tw-gap-6">
                            <div className="tw-bg-white tw-rounded-xl tw-p-6 tw-shadow-sm tw-text-center">
                            <img src="/images/icon5.jpg" alt="icon5" className="tw-rounded-full tw-w-20 tw-h-20 tw-mx-auto"/>
                            <p className="tw-font-medium tw-text-lg tw-mt-3">Tiền hôn nhân</p>
                            </div>
                            <div className="tw-bg-white tw-rounded-xl tw-p-6 tw-shadow-sm tw-text-center">
                            <img src="/images/icon6.jpg" alt="icon6" className="tw-rounded-full tw-w-20 tw-h-20 tw-mx-auto"/>
                            <p className="tw-font-medium tw-text-lg tw-mt-3">Nhi</p>
                            </div>
                            <div className="tw-bg-white tw-rounded-xl tw-p-6 tw-shadow-sm tw-text-center">
                            <img src="/images/icon7.jpg" alt="icon7" className="tw-rounded-full tw-w-20 tw-h-20 tw-mx-auto"/>
                            <p className="tw-font-medium tw-text-lg tw-mt-3">Thanh thiếu niên</p>
                            </div>
                            <div className="tw-bg-white tw-rounded-xl tw-p-6 tw-shadow-sm tw-text-center">
                            <img src="/images/icon8.jpg" alt="icon8" className="tw-rounded-full tw-w-20 tw-h-20 tw-mx-auto"/>
                            <p className="tw-font-medium tw-text-lg tw-mt-3">Người trưởng thành</p>
                            </div>
                        </div>
                    </div>

                    {/* Bệnh */}
                    <div className="tw-mt-12">
                    <div className="tw-flex tw-items-left tw-mb-6">
                        <h3 className="tw-text-2xl tw-font-semibold">Bệnh</h3>
                        <div className="tw-border-l-2 tw-border-gray-300 tw-h-8 tw-mx-6"></div>

                        <button  type="button" className="tw-text-blue-500 tw-text-lg hover:tw-underline  tw-flex tw-items-center" >
                            Xem tất cả
                            <i className="fa-solid fa-angles-right tw-pl-3"></i>
                        </button>
                    </div>
                    <div className="tw-grid tw-grid-cols-4 tw-gap-6">
                        <div className="tw-bg-white tw-rounded-xl tw-p-6 tw-shadow-sm tw-text-center">
                        <img src="/images/icon9.jpg" alt="icon9" className="tw-rounded-full tw-w-20 tw-h-20 tw-mx-auto" />
                        <p className="tw-font-medium tw-text-lg tw-mt-3">Bệnh mãn tính</p>
                        </div>
                        <div className="tw-bg-white tw-rounded-xl tw-p-6 tw-shadow-sm tw-text-center">
                        <img src="/images/icon10.jpg" alt="icon10" className="tw-rounded-full tw-w-20 tw-h-20 tw-mx-auto"/>
                        <p className="tw-font-medium tw-text-lg tw-mt-3">Bệnh thường gặp ở trẻ em</p>
                        </div>
                        <div className="tw-bg-white tw-rounded-xl tw-p-6 tw-shadow-sm tw-text-center">
                        <img src="/images/icon11.jpg" alt="icon11" className="tw-rounded-full tw-w-20 tw-h-20 tw-mx-auto"/>
                        <p className="tw-font-medium tw-text-lg tw-mt-3">Bệnh truyền nhiễm</p>
                        </div>
                        <div className="tw-bg-white tw-rounded-xl tw-p-6 tw-shadow-sm tw-text-center">
                        <img src="/images/icon12.jpg" alt="icon12" className="tw-rounded-full tw-w-20 tw-h-20 tw-mx-auto"/>
                        <p className="tw-font-medium tw-text-lg tw-mt-3">Phòng bệnh</p>
                        </div>
                    </div>
                    </div>

                </div>
                </div>
            </section>

        </div>
    );
}
