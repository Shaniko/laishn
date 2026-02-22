

# בדיקות + "זכור אותי" בהתחברות

## 1. תיבת סימון "זכור אותי" בדף ההתחברות

בדף ההתחברות (Auth.tsx) תתווסף תיבת סימון "זכור אותי" מתחת לשדה הסיסמה (מופיעה רק במצב login).

כשהתיבה מסומנת - המשתמש יישאר מחובר גם אחרי סגירת הדפדפן. כשלא מסומנת - הסשן יימחק כשהטאב נסגר.

### איך זה עובד טכנית
- Supabase Auth שומר את הטוקן ב-localStorage כברירת מחדל (שומר על חיבור)
- כש"זכור אותי" לא מסומן, נעביר את הטוקן ל-sessionStorage אחרי ההתחברות, כך שהוא נמחק כשהדפדפן נסגר
- state חדש: `rememberMe` (boolean, ברירת מחדל: true)
- אחרי התחברות מוצלחת, אם `rememberMe === false`:
  - נקרא ל-`supabase.auth.getSession()` ונשמור את הטוקנים ב-sessionStorage
  - נמחק מ-localStorage

### שינויים ב-Auth.tsx
- ייבוא Checkbox מ-components/ui/checkbox
- הוספת state `rememberMe`
- הוספת שורה עם Checkbox + label "זכור אותי" מתחת לשדה הסיסמה
- לוגיקה אחרי signInWithPassword מוצלח: אם לא מסומן, העברת טוקנים ל-sessionStorage

---

## 2. בדיקות (Unit Tests)

### קובץ חדש: src/test/utils.test.ts
- בדיקה שפונקציית `cn()` עובדת נכון (מיזוג classes)

### קובץ חדש: src/test/useItems.test.ts
- בדיקות לטיפוסי ה-ItemWithCategory
- בדיקה שהאובייקט שנשלח ל-addItem מכיל את כל השדות הנדרשים

### קובץ חדש: src/test/Stats.test.ts
- בדיקות ללוגיקת חישוב הסטטיסטיקות (סה"כ פריטים, הוצאות, סטטוס אחריות)
- בדיקה שנתוני הגרפים מחושבים נכון (קטגוריות, ציר זמן רכישות)

### קובץ חדש: src/test/Auth.test.ts
- בדיקה שמצב login/signup/forgot משנה את הטקסט בכפתור
- בדיקה שתיבת "זכור אותי" מופיעה רק במצב login

### קובץ חדש: src/test/warranty.test.ts
- בדיקה שפונקציית getWarrantyStatus מחזירה תוצאה נכונה לתאריך עתידי (פעילה), עבר (פגה), ו-null (לא הוגדרה)

---

## פרטים טכניים

### קבצים שישתנו
- **src/pages/Auth.tsx** - הוספת Checkbox "זכור אותי" + לוגיקת sessionStorage

### קבצים חדשים
- **src/test/utils.test.ts** - בדיקות cn()
- **src/test/Stats.test.ts** - בדיקות לוגיקת סטטיסטיקות
- **src/test/Auth.test.ts** - בדיקות מצבי Auth
- **src/test/warranty.test.ts** - בדיקות סטטוס אחריות

### ייצוא פונקציות לבדיקה
- פונקציית `getWarrantyStatus` תיוצא (export) מ-ItemView.tsx כדי שנוכל לבדוק אותה ישירות
