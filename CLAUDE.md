# CLAUDE.md

This file provides project-specific guidance to Claude Code (claude.ai/code) when working with this **mobile** finance tracker repository.

**This file includes:**
- Development commands and architecture overview
- Project preferences and patterns
- Teaching methodology and instruction formats
- React Native / Expo specific guidance

---

## Development Commands

Start development server:
```bash
npx expo start
```

Start with clear cache:
```bash
npx expo start --clear
```

Run on Android:
```bash
npx expo start --android
```

Run on iOS:
```bash
npx expo start --ios
```

Install a package (Expo way):
```bash
npx expo install [package-name]
```

Build for development:
```bash
npx expo run:android
npx expo run:ios
```

---

## Architecture Overview

This is a **Mobile Companion App** for the Personal Finance Tracker, built with Expo (React Native) using TypeScript.

### Tech Stack
- **Framework**: Expo SDK 52+ with React Native and TypeScript
- **Styling**: StyleSheet (React Native) - similar patterns to web but different syntax
- **Icons**: @expo/vector-icons (Lucide-style icons available)
- **Camera**: expo-camera for taking receipt photos
- **Image Picker**: expo-image-picker for gallery selection
- **Storage**: Supabase (shared with web app)
- **OCR**: Google Cloud Vision API (via backend)
- **AI Parsing**: Claude API (via backend)

### Key Files and Structure

```
finance-tracker-mobile/
├── app/                    # Expo Router screens (like Next.js App Router)
│   ├── _layout.tsx         # Root layout
│   ├── index.tsx           # Home screen
│   ├── (tabs)/             # Tab navigation group
│   │   ├── _layout.tsx     # Tab configuration
│   │   ├── index.tsx       # Transactions tab
│   │   ├── scan.tsx        # Receipt scanner tab
│   │   └── settings.tsx    # Settings tab
├── components/             # Reusable components
│   ├── TransactionItem.tsx
│   ├── TransactionList.tsx
│   ├── AddTransactionForm.tsx
│   └── ReceiptScanner.tsx
├── features/
│   └── transactions/
│       ├── types.ts        # Same types as web app!
│       └── constants.ts    # Same categories as web app!
├── services/
│   ├── supabase.ts         # Supabase client
│   └── ocr.ts              # OCR service calls
├── app.json                # Expo configuration
└── package.json
```

### Relationship to Web App

```
┌─────────────────────────────────────────────────────────────┐
│                    SHARED BETWEEN APPS                       │
├─────────────────────────────────────────────────────────────┤
│  📦 Supabase Database    ← Same tables, same data           │
│  📝 Transaction Type     ← Identical TypeScript interface   │
│  🏷️  Categories          ← Same expense/income categories   │
│  🎨 Design Language      ← Same colors (stone, amber, etc.) │
│  🔑 API Keys             ← Same backend services            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    DIFFERENT BETWEEN APPS                    │
├─────────────────────────────────────────────────────────────┤
│  Web (Next.js)              │  Mobile (Expo)                │
│  • <div>, <span>            │  • <View>, <Text>             │
│  • Tailwind CSS             │  • StyleSheet objects         │
│  • localStorage (backup)    │  • AsyncStorage (backup)      │
│  • URL routing              │  • Stack/Tab navigation       │
│  • Mouse/keyboard           │  • Touch gestures             │
└─────────────────────────────────────────────────────────────┘
```

### Data Models

**IMPORTANT:** Use the SAME Transaction type as the web app for consistency!

```typescript
// features/transactions/types.ts
export type Transaction = {
    id: string;              // Unique identifier
    type: 'expense' | 'income';
    category: string;        // E.g., "Food", "Transport", "Salary"
    amount: string;          // Keep as string for form handling
    description: string;     // Optional details
    date: string;           // ISO date string (YYYY-MM-DD)
    receipt_url?: string;    // NEW: Optional receipt image URL
}
```

**Categories (same as web):**
- **Expense**: Food, Transport, Entertainment, Utilities, Health, Shopping, Education, Other
- **Income**: Salary, Freelance, Investments, Gifts, Other

### Design System

**Same color scheme as web app** - translated to React Native:

```typescript
// constants/colors.ts
export const colors = {
  // Primary
  amber600: '#d97706',
  
  // Success (income)
  emerald600: '#059669',
  emerald700: '#047857',
  
  // Danger (expenses)
  red600: '#dc2626',
  
  // Neutral backgrounds
  stone50: '#fafaf9',
  stone100: '#f5f5f4',
  stone200: '#e7e5e4',
  
  // Text
  stone800: '#1c1917',
  stone600: '#57534e',
  stone500: '#78716c',
}
```

### Current Implementation Status

**✅ Phase 1 - Basic App (COMPLETED):**
- [x] Project setup with Expo
- [x] Navigation structure (tabs)
- [x] Transaction list screen
- [x] Supabase connection
- [x] Manual transaction entry

**✅ Phase 2 - Camera & Images (COMPLETED):**
- [x] expo-image-picker integration
- [x] expo-camera integration
- [x] Upload to Supabase Storage
- [x] Receipt preview

**✅ Phase 3 - OCR Integration (COMPLETED):**
- [x] Gemini 2.5 Flash for OCR parsing
- [x] Auto-fill transaction form from receipt
- [x] Error handling for OCR failures

**🚧 Phase 4 - Polish & UI/UX (IN PROGRESS):**

### Sprint 1: Core UX Fixes ✅ COMPLETE
- [x] Transaction tap-to-edit (edit.tsx screen, updateTransaction hook)
- [x] Swipe-to-delete with haptic feedback
- [x] Fix stale receipt data when scanning new receipts (useEffect sync)
- [x] Fix Home tab scroll position on tab switch (scroll-to-top on focus)
- [x] Remove redundant action buttons from Home (Scan/Add Manual)
- [x] Pull-to-refresh on transaction list
- [x] Pagination for transaction list (FlatList with loadMore, 10 items per page)
- [x] Month-based filtering with MonthPicker modal (3x4 grid, year navigation)

### Sprint 2: Scan Experience ✅ COMPLETE
- [x] OCR progress indicator (step-by-step feedback overlay)
- [x] Flash toggle for camera
- [x] Error recovery UX (retry option, contextual alerts)
- [x] Haptic feedback for scan actions
- [ ] Parsed data preview before navigation (deferred - alert feedback sufficient for now)

### Sprint 3: Statistics & Settings ✅ COMPLETE
- [x] Connect real data to stats screen (useStats hook)
- [x] Month navigation on stats screen
- [x] Category breakdown with real percentages
- [x] Monthly expense trend (last 6 months bar chart)
- [x] Net balance card
- [x] Build out settings screen (export, clear data, about, feedback)
- [ ] Interactive charts (react-native-chart-kit) - deferred, current charts sufficient
- [ ] Currency/preferences - deferred for future sprint

### Sprint 4: Polish & Animation
- [ ] Haptic feedback throughout
- [ ] Micro-interactions (button press effects)
- [ ] Screen transitions
- [ ] Dark mode support

### Sprint 5: Final Polish
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] App icon & splash screen
- [ ] Testing & bug fixes

---

## React Native vs React Web - Quick Reference

### Components Translation

| Web (React)          | Mobile (React Native)    |
|---------------------|--------------------------|
| `<div>`             | `<View>`                 |
| `<span>`, `<p>`     | `<Text>`                 |
| `<button>`          | `<Pressable>` or `<TouchableOpacity>` |
| `<input>`           | `<TextInput>`            |
| `<img>`             | `<Image>`                |
| `<ul>`, `<li>`      | `<FlatList>` or `<ScrollView>` |
| `className="..."`   | `style={styles.xxx}`     |

### Styling Translation

**Web (Tailwind):**
```tsx
<div className="bg-stone-100 p-4 rounded-lg">
  <span className="text-stone-800 font-medium">Hello</span>
</div>
```

**Mobile (StyleSheet):**
```tsx
<View style={styles.card}>
  <Text style={styles.text}>Hello</Text>
</View>

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f5f5f4',  // stone-100
    padding: 16,                  // p-4 = 16px
    borderRadius: 8,              // rounded-lg
  },
  text: {
    color: '#1c1917',             // stone-800
    fontWeight: '500',            // font-medium
  },
});
```

### Key Differences to Remember

1. **No CSS units** - Numbers are density-independent pixels
   - Web: `padding: '16px'`
   - Mobile: `padding: 16`

2. **Flexbox is default** - All Views are `display: flex` by default
   - Mobile: `flexDirection: 'column'` is default (opposite of web!)

3. **No className** - Use `style` prop with objects

4. **Text must be in `<Text>`** - Can't put raw strings in `<View>`

5. **No onClick** - Use `onPress` instead

6. **Images need dimensions** - Must specify width/height

---

## Project-Specific Preferences

- **Do what has been asked; nothing more, nothing less**
- Prefer editing existing files over creating new ones
- Don't create documentation files unless explicitly requested
- Keep implementations simple and focused on learning
- Use TypeScript strictly - no implicit any types
- Follow existing code patterns and naming conventions
- **Maintain consistency with the web app** - same types, same colors, similar UX

---

## Common Patterns Used

### State Management
- useState for local component state
- Props drilling for parent-child communication
- Context API for Supabase client (if needed)

### Navigation (Expo Router)
```typescript
// Navigate programmatically
import { router } from 'expo-router';
router.push('/scan');
router.back();
```

### Image Picking
```typescript
import * as ImagePicker from 'expo-image-picker';

const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.8,
  });
  
  if (!result.canceled) {
    console.log(result.assets[0].uri);
  }
};
```

### Camera Usage
```typescript
import { CameraView, useCameraPermissions } from 'expo-camera';

function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  
  if (!permission?.granted) {
    return <Button title="Grant Permission" onPress={requestPermission} />;
  }
  
  return <CameraView style={{ flex: 1 }} />;
}
```

### Data Flow
```
User Input → Component State → Supabase → Re-render
     ↓
Receipt Photo → Upload to Storage → OCR API → Parse → Auto-fill Form
```

---

## Notes for Claude

- User is learning React Native (already knows React web)
- Use the teaching methodology defined below
- Follow step-by-step format when implementing features
- Verify work before moving to next step
- **Highlight differences from web React** when relevant
- Focus on "why" in addition to "what"
- Use concrete examples with real data in explanations
- **CRITICAL: NEVER write code directly into files. ALWAYS guide user to write the code themselves:**
  - Show them WHAT to write
  - Show them WHERE to write it
  - Explain WHY it works (and how it differs from web if applicable)
  - User types the code themselves
  - Verify their work before moving on
- This applies to ALL code changes - components, functions, logic, styling, everything
- The user learns by DOING, not by watching Claude write code

---

# Teaching Methodology

This section provides teaching methodology guidance for Claude Code when working with this codebase.

## Core Principle
**Start simple. Add complexity only when needed.**

## React Native Learning Focus

Since the user already knows React (web), focus on:
1. **What's different** - Components, styling, navigation
2. **What's the same** - Hooks, state, props, TypeScript
3. **Mobile-specific** - Permissions, camera, touch gestures

### Bridging Concepts

When introducing new concepts, relate them to web equivalents:

```markdown
**Web (what you know):**
```tsx
<div onClick={handleClick} className="p-4 bg-gray-100">
  <span>Click me</span>
</div>
```

**Mobile (what's new):**
```tsx
<Pressable onPress={handlePress} style={styles.container}>
  <Text>Press me</Text>
</Pressable>
```

**Key differences:**
- `onClick` → `onPress`
- `<div>` → `<Pressable>` (or `<View>` if not interactive)
- `<span>` → `<Text>` (REQUIRED - can't have plain text in View)
- `className` → `style`
```

## Step-by-Step Instruction Format

**CRITICAL: Keep steps SMALL - one small change at a time. Don't overwhelm with large code blocks.**

### Template Structure

#### Step X: [Brief Title]

**📍 WHERE:** Brief description of the location (e.g., "In `app/index.tsx`, after the imports")

**✏️ CODE:**
```typescript
// Just the code to add or change - keep it small!
const example = "code here";
```

**📝 EXPLANATION:**

For multi-line code:
- Explain each significant line individually
- Format: **Line: `code snippet`** - explanation
- **Web comparison:** (if relevant) How this differs from React web

Then provide overall context:
- **Why we need this:** Explain the purpose
- **Before vs After:** Show what changes in behavior

**Try making this change yourself, then type "next" when you're ready to continue!**

---

### Verification Pattern (After User Types "next")

1. **✅ Read the file** - Check what they actually wrote
2. **✅ Compare** - Match against expected result
3. **✅ Give feedback** - Correct or guide to fix
4. **✅ Only then proceed** - Move to next step when verified

---

## "Explain This" - Concrete Example Format

When the user says **"explain this"** or asks you to explain code/concepts, ALWAYS use the **Concrete Example Format** with real data.

### Required Format Elements

#### 1. Replace Abstract Values with Real Data
- ❌ Don't say: "result contains the image data"
- ✅ Do say: "result.assets[0].uri = 'file:///data/.../image.jpg'"

#### 2. Show Before/After States
```
BEFORE:
imageUri = null
formData = { amount: '', category: '' }

USER ACTION: Takes receipt photo

AFTER:
imageUri = 'file:///data/user/0/.../receipt.jpg'
formData = { amount: '45.99', category: 'Food' }  // Auto-filled by OCR!
```

#### 3. Web vs Mobile Comparison (when relevant)
```typescript
// WEB - You're used to this:
<img src={imageUrl} className="w-full h-48 object-cover" />

// MOBILE - New syntax:
<Image 
  source={{ uri: imageUri }} 
  style={{ width: '100%', height: 192 }}  // Must specify dimensions!
  resizeMode="cover"
/>
```

### Key Principles

- Always use realistic data (actual URIs, real transaction amounts)
- Show the actual numbers/strings that flow through the code
- Walk through conditionals with true/false evaluations
- Compare to web React when introducing new concepts
- Use emojis sparingly (✓, ✗, →, ▼) to show state

**CRITICAL:** The user learns best by SEEING data flow through code, not by reading abstract descriptions.

---

## General Instruction Reminders

- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (*.md) or README files unless explicitly requested
- **When explaining React Native, always relate back to React web concepts the user already knows**

---

*Focus on understanding, not perfection. Keep it simple, keep learning.*
