# Bảng giá rank và quy tắc ASCEND

## Nguồn dữ liệu

- File người dùng: `BoostRoyal_Bang_Gia_2026-10-06_Partial (2).xlsx`, ngày 06/10/2026. Đã đọc 702 báo giá: 617 LoL, 84 TFT, 1 Valorant. Bản trích được giữ trong `data/pricing/boostroyal-workbook.json`; file Excel gốc không bị sửa.
- Bổ sung ngày 07/10/2026 từ các bộ tính giá công khai: [LoL](https://boostroyal.com/lol-boosting), [TFT](https://boostroyal.com/tft-boosting), [Valorant](https://boostroyal.com/valorant-boosting).
- Đã lấy đủ 55 báo giá LoL NA bị thiếu trong Excel; lưu riêng tại `data/pricing/boostroyal-reference-supplement.json` để đối chiếu với bảng gốc.
- Trang công khai cung cấp endpoint `https://api.boost-royal.com/checkout/calculatePrice`. Chỉ đọc báo giá, không đăng nhập hoặc tạo đơn hàng. Cấu hình request được đọc từ HTML công khai của từng trang, không thực thi mã bên thứ ba.
- `boostroyal-live.json`: 1.908 báo giá từng chặng, có giá thô, giá gốc, server, dịch vụ, điểm nhận và thời điểm lấy. LoL: 7 server × 8 mức LP × 28 chặng. TFT: 7 server × 28 chặng. Valorant: 6 lựa chọn khu vực trong UI × 24 chặng, PC, 22 RR/trận.
- LoL/TFT dùng EUW, EUNE, NA, OCE, KR, CN, SEA. Với Valorant, EUW/EUNE cùng nguồn EU; OCE/SEA cùng nguồn SEA/OCE. BoostRoyal không cung cấp lựa chọn CN cho Valorant.
- Mốc RR Valorant tham khảo [Riot Support](https://support.riotgames.com/en-us/valorant/gameplay/rank-rating-rr-for-immortal-and-radiant-ranks), đọc ngày 07/10/2026. Radiant cần thêm vị trí top 500, nên yêu cầu xác nhận riêng.

## Cách tính

File Excel chứa tổng tiền từ mỗi rank lên một đích cố định, không phải giá từng chặng. Các khuyến mại theo tổng tiền có thể khiến hai tổng giá liền kề không giảm đều. Không lấy hiệu các tổng đó làm giá một bậc.

Website dùng các báo giá từng chặng thu thập ngày 07/10, cộng các chặng khách chọn rồi áp dụng quy tắc ASCEND. Vì vậy tổng nhiều chặng không sao chép khuyến mại gói của BoostRoyal trong Excel. Các báo giá gốc vẫn được lưu để đối chiếu. Giá USD từ calculator được chuyển theo quy tắc hiển thị của nguồn: `Math.round(price) - 0.01`.

1. Mỗi chặng Iron, Bronze, Silver, Gold, Platinum giảm 10%. Ví dụ Platinum I → Emerald IV vẫn là chặng Platinum nên được giảm; Emerald IV → Emerald III không được giảm.
2. NA giảm 15% mọi chặng, **thay thế** giảm 10%. Không cộng thành 25% và không nhân tiếp 0,9 × 0,85.
3. KR nhân 1,2 mọi chặng. Chặng thấp trên KR đồng thời nhân 0,9, hệ số cuối 1,08; chặng cao dùng 1,2.
4. LoL/TFT Master+: chia phần LP theo các dải tính giá, cộng từng phần. Đây là mốc thương mại của shop; mốc thăng hạng thật còn phụ thuộc bảng xếp hạng.

| Dải tính giá | Giá cơ bản USD/LP | NA | KR |
| --- | ---: | ---: | ---: |
| Master: 0 → 500 LP | 1,80 | 1,53 | 2,16 |
| Grandmaster: 500 → 1.000 LP | 2,50 | 2,125 | 3,00 |
| Challenger: 1.000 → 1.500 LP | 3,70 | 3,145 | 4,44 |

LP thứ 500 là điểm bắt đầu dải Grandmaster; LP thứ 1.000 là điểm bắt đầu dải Challenger. Tăng 400 → 600 LP: 100 × 1,8 + 100 × 2,5 = 430 USD cơ bản; NA 365,50 USD; KR 516 USD. Giới hạn Challenger 1.500 LP được giữ từ UI hiện có.

5. Mức LP/trận LoL dùng các mã của nguồn Excel/calculator: 30+, 28+, 25+, 22+, 19+, 17+, 14+, ≤14. Khi nguồn làm tròn khiến mức nhận LP thấp có giá bằng hoặc thấp hơn mức cao, giá được tăng tối thiểu 0,02 USD/chặng để duy trì thứ tự sau giảm NA và làm tròn cent. Các thay đổi được ghi riêng trong `lp-order-adjustments.json` (376 ô ở lần thu thập này); giá nguồn không bị ghi đè. Ví dụ nhóm 17+ đắt hơn nhóm 22+.
6. Tỷ lệ LP/trận chỉ ảnh hưởng chặng dưới Master của LoL. Master+ dùng giá mỗi LP do người dùng chỉ định. TFT không có bộ chọn LP/trận; Valorant hiện sử dụng 22 RR/trận trên PC.
7. Phụ phí phần trăm được cộng trên tổng giá rank sau điều chỉnh, phụ phí cố định cộng sau cùng. Thứ tự bật tùy chọn không ảnh hưởng giá. Làm tròn tổng cuối đến 2 chữ số thập phân.

## UI và phạm vi

- Giá được tính đồng bộ từ `rank-prices.json` khoảng 35 KB, không gọi BoostRoyal khi khách đổi rank/server/LP.
- Ô LP có thể nhập số nguyên không âm; rank tự chuyển khi qua 500/1.000 LP. Các đơn giá cơ bản hiển thị cạnh dải LP, giá cuối phản ánh server.
- Order summary, thanh mobile và dialog dùng cùng công thức. Bản yêu cầu lưu LP/trận, tùy chọn và phiên bản giá; thay cấu hình sẽ xóa giá override cũ.
- Snapshot hiện bao gồm rank Solo LoL, Ranked TFT và Competitive PC Valorant. Các chế độ Duo, Flex, Hyper Roll, Double Up, Premier, Valorant CN và mục tiêu Radiant cần xác nhận báo giá. Không hiển thị giá 0 như một báo giá hợp lệ.
- Không áp bảng giá rank vào tài khoản, coaching hoặc placements. Các dữ liệu UI hiện có cho các dịch vụ đó được giữ.
- Thời gian hoàn thành vẫn là ước tính UI hiện có, chưa tích hợp API tiến độ.

## Cập nhật và ghép API

```powershell
node scripts/collect-boostroyal-pricing.mjs --refresh
node scripts/build-rank-prices.mjs
```

Không có `--refresh` thì script tiếp tục những cấu hình chưa thu thập xong. Script ghi lỗi rõ ràng, không biến dữ liệu thiếu thành giá 0. Chỉ chạy builder khi các báo giá cần thiết đã đầy đủ; rà giá trước khi phát hành.

`lib/rank-pricing.ts` giữ quy tắc kinh doanh và đơn giá Master+. `lib/quote.ts` giữ công thức dùng chung. Khi ghép API, backend phải tính lại từ cấu hình và mã tùy chọn, kiểm tra phạm vi rank/LP/server, dùng cùng phiên bản giá; không nhận giá client làm giá thanh toán. Lưu snapshot giá cùng đơn hàng để thay bảng giá sau này không sửa đơn cũ.
