1.  User            使用者 
                    > id
                    > name 
                    > email
                    > password
                    > role
                    > created_at
                    > updated_at

2.  Skill           技能
                    > id
                    > name
                    > created_at

3.  CoachLinkSkill  教練技能
                    > id
                    > coach_id
                    > skill_id

4.  Coach           教練
                    > id
                    > user_id
                    > experience_years
                    > description
                    > profile_image_url
                    > created_at
                    > updated_at



5.  Course          課程
                    > id
                    > user_id
                    > skill_id
                    > name
                    > description
                    > start_at
                    > end_at
                    > max_participants
                    > meeting_url
                    > created_at
                    > updated_at

6.  CreditPackage   方案 (Ex: "7天方案" ,"7堂課" ,1400 )
                    > id
                    > name
                    > credit_amount
                    > price
                    > created_at

7.  CreditPurchase  購買方案紀錄 (Ex: "7天方案 ,"8堂課" ,1300)
                    > id
                    > user_id
                    > credit_package_id
                    > purchased_credits
                    > price_paid
                    > purchase_at

8.  CourseBooking   報名課程表紀錄 (Ex: 有報名xxx課程才會在CourseBooking增加一筆資料 )
                    > id
                    > user_id
                    > course_id 
                    > created_at   
                    > cancelled_at   // null 代表沒有取消課程 代表上完1堂課了