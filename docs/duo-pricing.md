# Giá LoL Duo — 10/10/2026

`lib/pricing/duo-pricing-matrix.ts` xuất `DUO_PRICING_TABLE`, `SERVER_MULTIPLIERS` và `calculateDuoPrice(input)`.

Người dùng xác nhận **10 USD chỉ là ví dụ cho hệ số server**, không phải giá cố định mỗi trận. Quy tắc người dùng thay thế các hệ số chung trong file Markdown: NA ×1; KR ×1,20; mọi server còn lại ×0,85.

## Giá cơ bản NA theo trận

Tham khảo các thẻ giá USD công khai trên [BoostRoyal Pro Duo](https://boostroyal.com/lol-boosting/pro-duo), kiểm tra bằng Chrome ngày 10/10/2026 sau khi trang tải xong. HTML ban đầu hiển thị các số EUR với ký hiệu USD trước khi hydration, nên không dùng giá từ HTML ban đầu làm giá USD. Đây là giá cơ bản được ASCEND chọn; không sao chép tổng khuyến mại hoặc điều kiện số trận tối thiểu của nguồn.

| Rank khách hàng | USD/trận |
| --- | ---: |
| Iron, Bronze, Silver, Gold, Platinum — IV đến I | 5,99 |
| Emerald IV đến I; Diamond IV, III | 8,99 |
| Diamond II, I | 14,99 |
| Master, Grandmaster, Challenger | 17,99 |
| Chơi thường, mọi rank | 2,99 |

Nguồn chia các gói theo nhóm; không có đơn giá riêng cho mỗi division thấp hoặc từng bậc Master+. Ma trận triển khai đầy đủ 28 division thường và 3 bậc cao theo các nhóm này. Rank của tuyển thủ trên thẻ nguồn không phải rank khách hàng.

## Công thức

1. Đơn giá USD = giá cơ bản NA × hệ số server, làm tròn đến cent.
2. Tạm tính = đơn giá đã làm tròn × số trận (số nguyên 1–20).
3. Giảm 0% cho 1–2 trận; 5% cho 3–4; 10% cho 5–20. Khoản giảm được làm tròn đến cent.
4. Tổng = tạm tính − khoản giảm. Nếu chọn Express, cộng 20% trên tổng đã giảm.
5. USD là tiền tệ chuẩn cho giỏ hàng và checkout. UI EUR dùng tỷ giá đang có của website. Hàm nhận thêm `usdPerEur` khi yêu cầu EUR; thiếu hoặc tỷ giá không hợp lệ sẽ báo lỗi, không dùng tỷ giá giả.

Trường EUR trong bảng là **giá tham khảo quy đổi từ USD**, theo snapshot EUR/USD 1,12049503 ngày 09/10 trong `outputs/boostroyal-20261009/research/exchange-rates.json`. Không dùng giá tham khảo đó để chốt đơn EUR; `calculateDuoPrice` đổi tổng USD đã giảm bằng tỷ giá được truyền vào. EUR mỗi trận làm tròn có thể lệch một cent khi nhân số lượng; tổng USD chuẩn quyết định tổng EUR.

Ví dụ Silver IV, 5 trận: NA 5,99 × 5 = 29,95; giảm 3,00; tổng 26,95 USD. EUW đơn giá 5,09, tổng 22,90 USD. KR đơn giá 7,19, tổng 32,35 USD.

```ts
calculateDuoPrice({
  rank: "Silver IV", server: "NA", gameCount: 5,
  currency: "USD", queueType: "ranked",
});
```

`ranked` chỉ nhận Iron–Diamond với division; `high_elo` chỉ nhận Master/Grandmaster/Challenger; `normal` bỏ qua rank. Các đầu vào sai không tạo báo giá tự động. UI chỉ hiển thị rank phù hợp với chế độ và bỏ ô rank cho chơi thường. Giỏ hàng, nút checkout và thanh mobile dùng cùng tổng giá.

Giá LP Master 1,80 / Grandmaster 2,50 / Challenger 3,10 USD/LP nằm trong `APEX_PRICE_BANDS`, dùng cho **nâng rank**, không dùng làm giá Duo theo trận. Giá Net Wins và Placements giữ dữ liệu khảo sát hiện có, cùng hệ số server. Chưa có thời gian giao Duo được xác minh nên không hiển thị thời gian 0–0 giờ.

Checkout hiện là mô phỏng. Backend thanh toán thật cần tính lại từ cấu hình thay vì tin số tiền client/URL.

## Kiểm tra

Chạy `npm run test:pricing`, `npm run typecheck`, `npm run lint -- --max-warnings=0` và `npm run build`. Kiểm tra trình duyệt các chế độ, server, mốc giảm số lượng, USD/EUR, Express, giỏ hàng/checkout và màn hình nhỏ.

Đã kiểm tra ngày 10/10: 7 nhóm kiểm thử giá đều đạt; typecheck, lint không warning và build production đạt. Chrome xác nhận các mốc 1/2/3/4/5/20 trận, nhóm Diamond III/II, ba rank cao, chơi thường, NA/EUW/KR, USD/EUR với tỷ giá giả lập 1,10 để đối chiếu, Express, giỏ hàng và tổng checkout 32,34 USD cho Silver IV NA 5 trận kèm Express. Không tạo thanh toán hoặc đơn thật. Các khổ 1440/1024/768/390/320px không tràn ngang; tiền mỗi dòng giữ nguyên phần nguyên/lẻ. Nhãn tiếng Việt và trường hợp API tỷ giá trả 503 đã kiểm tra; EUR khóa CTA, USD tiếp tục được. Ảnh và script kiểm tra nằm trong `output/playwright/duo-*` (được Git bỏ qua).
