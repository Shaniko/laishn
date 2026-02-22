
# הוספה מהירה של מוצרים ברצף (Quick Add)

## חוויית המשתמש

לחיצה על כפתור ה-**+** בדשבורד תפתח פאנל הוספה מהירה בתחתית המסך (במקום לעבור לדף הטופס המלא). הפאנל כולל:

1. **שדה טקסט** עם פוקוס אוטומטי - מקלידים שם מוצר
2. **לחיצת Enter** או כפתור "הוסף" - הפריט נשמר מיד
3. השדה **מתרוקן** ונשאר בפוקוס - אפשר להמשיך להקליד את הבא
4. **הודעת toast** קצרה מאשרת כל הוספה עם שם הפריט
5. כפתור **X** לסגירת הפאנל
6. לינק **"טופס מלא"** למי שרוצה להוסיף פריט עם כל הפרטים

הפאנל יופיע עם אנימציה חלקה מלמטה, ויישאר צמוד לתחתית המסך.

כש-FAB פתוח הוא ישתנה לאייקון X לסגירה.

---

## פרטים טכניים

### קובץ: src/pages/Dashboard.tsx

**שינויים:**
- ייבוא `useItems` (כבר קיים בקוד דרך `useItems` - רק צריך לחלץ גם את `addItem`)
- ייבוא `toast` מ-`sonner` ו-`X` מ-`lucide-react`
- הוספת states: `quickAddOpen` (boolean), `quickName` (string)
- הוספת `inputRef` (useRef) לפוקוס אוטומטי
- פונקציית `handleQuickAdd`:
  - בדיקה ש-`quickName.trim()` לא ריק
  - קריאה ל-`addItem.mutateAsync({ name: quickName.trim() })`
  - איפוס השדה והחזרת פוקוס
  - הצגת toast עם שם הפריט שנוסף
- ה-FAB ישתנה: `onClick` יפתח/יסגור את הפאנל (toggle), האייקון ישתנה בין Plus ל-X
- פאנל fixed בתחתית המסך עם:
  - רקע card עם border למעלה וצל
  - שורה עם Input (כפתור Enter) + Button "הוסף"
  - שורה שנייה עם לינק "טופס מלא" (ניווט ל-`/item/new`) וכפתור X לסגירה
  - אנימציית slide-up פשוטה עם transition

### קומפוננטה חדשה: src/components/QuickAddPanel.tsx

כדי לשמור על קוד סמנטי וקריא, הפאנל יופרד לקומפוננטה נפרדת:

```
Props:
- isOpen: boolean
- onClose: () => void
- onAdd: (name: string) => Promise<void>
- isAdding: boolean
```

הקומפוננטה תכלול:
- ניהול ה-input state פנימי
- ref לפוקוס אוטומטי כשנפתח
- טיפול ב-Enter key
- ולידציה בסיסית (שם לא ריק)
- אנימציית כניסה/יציאה

### שינויים ב-Dashboard.tsx
- שימוש ב-`QuickAddPanel` במקום inline JSX
- ה-FAB ישתנה לפי מצב `quickAddOpen`
- שליפת `addItem` מ-`useItems`
