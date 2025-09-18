-- Seed only selected languages
insert into public.languages (code, name, direction)
values
  ('en','English','ltr'),
  ('ta','Tamil','ltr'),
  ('hi','Hindi','ltr'),
  ('bn','Bengali','ltr'),
  ('pa','Punjabi','ltr')
on conflict (code) do nothing;

-- Seed Indian states/UTs (unchanged)
insert into public.states (code, name, country_code) values
  ('AP','Andhra Pradesh','IN'),
  ('AR','Arunachal Pradesh','IN'),
  ('AS','Assam','IN'),
  ('BR','Bihar','IN'),
  ('CT','Chhattisgarh','IN'),
  ('GA','Goa','IN'),
  ('GJ','Gujarat','IN'),
  ('HR','Haryana','IN'),
  ('HP','Himachal Pradesh','IN'),
  ('JH','Jharkhand','IN'),
  ('KA','Karnataka','IN'),
  ('KL','Kerala','IN'),
  ('MP','Madhya Pradesh','IN'),
  ('MH','Maharashtra','IN'),
  ('MN','Manipur','IN'),
  ('ML','Meghalaya','IN'),
  ('MZ','Mizoram','IN'),
  ('NL','Nagaland','IN'),
  ('OR','Odisha','IN'),
  ('PB','Punjab','IN'),
  ('RJ','Rajasthan','IN'),
  ('SK','Sikkim','IN'),
  ('TN','Tamil Nadu','IN'),
  ('TG','Telangana','IN'),
  ('TR','Tripura','IN'),
  ('UP','Uttar Pradesh','IN'),
  ('UT','Uttarakhand','IN'),
  ('WB','West Bengal','IN'),
  ('AN','Andaman and Nicobar Islands','IN'),
  ('CH','Chandigarh','IN'),
  ('DN','Dadra and Nagar Haveli and Daman and Diu','IN'),
  ('DL','Delhi','IN'),
  ('JK','Jammu and Kashmir','IN'),
  ('LA','Ladakh','IN'),
  ('LD','Lakshadweep','IN'),
  ('PY','Puducherry','IN')
on conflict (code) do nothing;

