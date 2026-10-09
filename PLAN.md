# Space Tactics — точечный план

Небольшая top-down WEB-игра: один корабль игрока, манёвры с инерцией, щит, 3 вида оружия, 1–3 ИИ-противника на арене.

---

## 1. Цель MVP

За 2–4 минуты игрок:

1. выбирает корабль в меню;
2. выходит на арену;
3. летает с инерцией, ставит щит, меняет оружие;
4. побеждает или проигрывает;
5. видит результат и кнопку «ещё раз».

Вне MVP: мультиплеер, сюжет, открытый космос, 3D, сервер.

---

## 2. Стек

| Слой | Выбор | Зачем |
|---|---|---|
| Сборка | Vite 6 | быстрый dev-сервер, ESM |
| Язык | TypeScript 5 (strict) | типы для статов кораблей/оружия |
| Движок | Phaser 3.80+ | сцены, спрайты, Arcade Physics, input, камера |
| Физика | Arcade Physics | круги/прямоугольники, без Matter.js |
| Состояние UI | Phaser + DOM overlay или Phaser Text | HP/щит/оружие |
| Сохранение | `localStorage` | последний корабль, лучший счёт |
| Ассеты на старте | геометрические текстуры в коде | не ждать художника |
| Деплой (позже) | статика (`vite build` → GitHub Pages / любой хостинг) | |

### 2.1. Зависимости (`package.json`)

```json
{
  "name": "space-tactics",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "phaser": "^3.87.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vite": "^6.0.0"
  }
}
```

### 2.2. TypeScript (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "lib": ["ES2022", "DOM"]
  },
  "include": ["src"]
}
```

### 2.3. Vite (`vite.config.ts`)

```ts
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: { port: 5173 },
});
```

Phaser под Vite: в `index.html` один `#app` или сразу canvas создаёт Phaser. Не подключать Phaser через CDN, если уже есть npm.

---

## 3. Структура файлов

```
space-tactics/
  PLAN.md
  package.json
  tsconfig.json
  vite.config.ts
  index.html
  public/
    assets/
      ships/          # позже: player.png, enemy.png
      vfx/            # вспышка, взрыв
      audio/          # shot.wav, hit.wav, shield.wav
  src/
    main.ts
    game/
      config.ts
      types.ts
      scenes/
        BootScene.ts
        MenuScene.ts
        ArenaScene.ts
        ResultScene.ts
      entities/
        Ship.ts
        Projectile.ts
      systems/
        InputController.ts
        CombatSystem.ts
        AIController.ts
        ArenaBounds.ts
        Hud.ts
      data/
        ships.ts
        weapons.ts
        constants.ts
```

Правило: **статы только в `data/`**, логика только в `entities/` и `systems/`, сцены только клеят системы вместе.

---

## 4. Точки входа

### 4.1. `index.html`

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Space Tactics</title>
    <style>
      html, body { margin: 0; height: 100%; background: #05070c; overflow: hidden; }
      #game { width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <div id="game"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

### 4.2. `src/main.ts`

```ts
import Phaser from "phaser";
import { gameConfig } from "./game/config";

new Phaser.Game(gameConfig);
```

### 4.3. `src/game/config.ts`

```ts
import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { MenuScene } from "./scenes/MenuScene";
import { ArenaScene } from "./scenes/ArenaScene";
import { ResultScene } from "./scenes/ResultScene";

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#05070c",
  physics: {
    default: "arcade",
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, ArenaScene, ResultScene],
};
```

---

## 5. Типы и данные

### 5.1. `src/game/types.ts`

```ts
export type WeaponId = "laser" | "plasma" | "missile";
export type Faction = "player" | "enemy";
export type ShipId = "interceptor" | "tank";

export interface WeaponDef {
  id: WeaponId;
  label: string;
  damage: number;
  cooldownMs: number;
  speed: number;
  lifetimeMs: number;
  radius: number;
  spreadDeg: number;
  homing: number; // 0 = нет, 0.04 = слабое наведение ракеты
}

export interface ShipDef {
  id: ShipId;
  label: string;
  hull: number;
  shield: number;
  shieldRegenPerSec: number;
  accel: number;
  maxSpeed: number;
  turnRateDeg: number;
  radius: number;
  weapons: WeaponId[];
}

export interface CombatResult {
  won: boolean;
  score: number;
  shipId: ShipId;
}
```

### 5.2. `src/game/data/constants.ts`

```ts
export const ARENA_RADIUS = 1800;
export const DRAG = 0.12;
export const SHIELD_MOVE_MUL = 0.7;
export const SHIELD_DRAIN_PER_SEC = 22;
export const PLAYER_KEYS = {
  thrust: "W",
  brake: "S",
  left: "A",
  right: "D",
  shield: "SHIFT",
  fire: "SPACE",
} as const;
```

### 5.3. `src/game/data/weapons.ts`

```ts
import type { WeaponDef, WeaponId } from "../types";

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  laser: {
    id: "laser",
    label: "Лазер",
    damage: 8,
    cooldownMs: 200,
    speed: 900,
    lifetimeMs: 900,
    radius: 4,
    spreadDeg: 1,
    homing: 0,
  },
  plasma: {
    id: "plasma",
    label: "Плазма",
    damage: 22,
    cooldownMs: 700,
    speed: 420,
    lifetimeMs: 1400,
    radius: 10,
    spreadDeg: 6,
    homing: 0,
  },
  missile: {
    id: "missile",
    label: "Ракета",
    damage: 40,
    cooldownMs: 2500,
    speed: 320,
    lifetimeMs: 2200,
    radius: 8,
    spreadDeg: 0,
    homing: 0.04,
  },
};
```

### 5.4. `src/game/data/ships.ts`

```ts
import type { ShipDef, ShipId } from "../types";

export const SHIPS: Record<ShipId, ShipDef> = {
  interceptor: {
    id: "interceptor",
    label: "Перехватчик",
    hull: 80,
    shield: 40,
    shieldRegenPerSec: 8,
    accel: 420,
    maxSpeed: 340,
    turnRateDeg: 220,
    radius: 16,
    weapons: ["laser", "plasma", "missile"],
  },
  tank: {
    id: "tank",
    label: "Танк",
    hull: 140,
    shield: 80,
    shieldRegenPerSec: 5,
    accel: 260,
    maxSpeed: 220,
    turnRateDeg: 140,
    radius: 22,
    weapons: ["laser", "plasma", "missile"],
  },
};
```

Баланс крутить **только здесь**, не в сценах.

---

## 6. Сцены — что делает каждая

| Сцена | Ключ | Вход | Выход |
|---|---|---|---|
| `BootScene` | `boot` | старт игры | `this.scene.start("menu")` после preload |
| `MenuScene` | `menu` | boot / result | `this.scene.start("arena", { shipId })` |
| `ArenaScene` | `arena` | menu | `this.scene.start("result", CombatResult)` |
| `ResultScene` | `result` | arena | menu или повтор arena |

### 6.1. `BootScene.ts` (скелет)

```ts
import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload() {
    // позже: this.load.image("player", "/assets/ships/player.png");
  }

  create() {
    this.scene.start("menu");
  }
}
```

На этапе 0 спрайты не грузить: корабль рисовать `Graphics` → `generateTexture("ship-tri")`.

### 6.2. `MenuScene.ts`

- текст «Space Tactics»;
- две кнопки кораблей (`interceptor` / `tank`);
- `localStorage.getItem("st-ship")` как выбранный по умолчанию;
- старт: `this.scene.start("arena", { shipId })`.

### 6.3. `ArenaScene.ts` — оркестратор

Порядок `create()`:

1. фон (звёзды);
2. группы физики `players`, `enemies`, `projectiles`;
3. создать `Ship` игрока в центре;
4. создать 1 врага (потом 2–3);
5. `InputController`, `CombatSystem`, `AIController`, `ArenaBounds`, `Hud`;
6. камера `startFollow(player)`.

`update(time, delta)`:

1. input → thrust / turn / shield / fire / weapon slot;
2. `player.updatePhysics(delta)`;
3. каждый enemy: `AIController.think` → те же команды;
4. `CombatSystem.step` (кулдауны, спавн пуль, overlap);
5. `ArenaBounds.clamp`;
6. `Hud.sync`;
7. проверка win/lose.

### 6.4. `ResultScene.ts`

Принимает `{ won, score, shipId }`. Кнопки: «ещё раз» (тот же `shipId`), «меню». Пишет `st-best-score` в `localStorage`.

---

## 7. Сущности и код систем

### 7.1. Команды корабля (единый контракт для игрока и ИИ)

```ts
export interface ShipCommand {
  thrust: number;   // -1..1  (газ / тормоз)
  turn: number;     // -1..1
  shield: boolean;
  fire: boolean;
  weapon: WeaponId;
}
```

Игрок и ИИ **не двигают спрайт напрямую**. Они только заполняют `ShipCommand`.

### 7.2. `Ship.ts` — ядро

Ответственность:

- `hull`, `shield`, `alive`;
- угол носа `heading` (радианы);
- `applyCommand(cmd, delta)`;
- `takeDamage(amount): boolean` — true, если умер;
- текущее оружие и `lastShotAt`.

Псевдокод физики (Arcade, без гравитации):

```ts
applyCommand(cmd: ShipCommand, dt: number) {
  this.heading += cmd.turn * Phaser.Math.DegToRad(this.def.turnRateDeg) * dt;

  const acc = this.def.accel * (this.shieldUp ? SHIELD_MOVE_MUL : 1);
  if (cmd.thrust > 0) {
    this.body.velocity.x += Math.cos(this.heading) * acc * dt * cmd.thrust;
    this.body.velocity.y += Math.sin(this.heading) * acc * dt * cmd.thrust;
  } else if (cmd.thrust < 0) {
    this.body.velocity.scale(1 - DRAG * 3 * dt);
  } else {
    this.body.velocity.scale(1 - DRAG * dt);
  }

  const speed = this.body.velocity.length();
  if (speed > this.def.maxSpeed) {
    this.body.velocity.scale(this.def.maxSpeed / speed);
  }

  this.rotation = this.heading;

  if (cmd.shield && this.shield > 0) {
    this.shieldUp = true;
    this.shield = Math.max(0, this.shield - SHIELD_DRAIN_PER_SEC * dt);
  } else {
    this.shieldUp = false;
    this.shield = Math.min(
      this.def.shield,
      this.shield + this.def.shieldRegenPerSec * dt,
    );
  }
}

takeDamage(amount: number): boolean {
  if (!this.alive) return false;
  if (this.shieldUp && this.shield > 0) {
    const absorbed = Math.min(this.shield, amount);
    this.shield -= absorbed;
    amount -= absorbed;
  }
  this.hull -= amount;
  if (this.hull <= 0) {
    this.alive = false;
    this.setActive(false).setVisible(false);
    this.body.stop();
    return true;
  }
  return false;
}
```

Коллайдер: круг `radius` из `ShipDef`. Тело не вращать вместе со спрайтом (`body.setAllowRotation(false)`), угол только визуальный.

### 7.3. `InputController.ts`

```ts
read(scene: Phaser.Scene, currentWeapon: WeaponId): ShipCommand {
  const kb = scene.input.keyboard!;
  const thrust =
    (kb.addKey("W").isDown ? 1 : 0) + (kb.addKey("S").isDown ? -1 : 0);
  const turn =
    (kb.addKey("D").isDown ? 1 : 0) + (kb.addKey("A").isDown ? -1 : 0);

  if (kb.addKey("ONE").isDown) currentWeapon = "laser";
  if (kb.addKey("TWO").isDown) currentWeapon = "plasma";
  if (kb.addKey("THREE").isDown) currentWeapon = "missile";

  return {
    thrust,
    turn,
    shield: kb.addKey("SHIFT").isDown,
    fire: kb.addKey("SPACE").isDown || scene.input.activePointer.isDown,
    weapon: currentWeapon,
  };
}
```

Тактика: **нос крутится A/D**, стрельба по направлению носа, не «всегда в мышь». Мышь можно позже добавить как опцию прицела в секторе ±30°.

Клавиши регистрировать **один раз в `create`**, в `update` только читать `.isDown`. Иначе утечка Key-объектов.

### 7.4. `Projectile.ts`

Поля: `faction`, `damage`, `homing`, `target?: Ship`, `bornAt`.

`update`: если `homing > 0` и цель жива — чуть поворачивать velocity к цели:

```ts
const desired = new Phaser.Math.Vector2(target.x - this.x, target.y - this.y).normalize();
this.body.velocity.lerp(desired.scale(speed), homing);
```

Удалять, если `now - bornAt > lifetimeMs` или вышел за `ARENA_RADIUS * 1.2`.

### 7.5. `CombatSystem.ts`

- `canFire(ship)`: `now - ship.lastShotAt >= weapon.cooldownMs`;
- `spawn(ship)`: позиция = нос корабля (`x + cos(h)*r`, `y + sin(h)*r`), угол = heading ± spread;
- overlap:

```ts
scene.physics.add.overlap(projectiles, ships, (proj, ship) => {
  const p = proj as Projectile;
  const s = ship as Ship;
  if (p.faction === s.faction) return;
  const dead = s.takeDamage(p.damage);
  p.destroy();
  if (dead) onShipDead(s);
});
```

Свои пули своих не бьют (`faction`).

### 7.6. `AIController.ts`

Для каждого врага раз в кадр (или каждые 100 мс):

```
если hull < 30% и shield > 10 → shield = true
иначе shield = false

дистанция до игрока:
  > 520  → thrust = 1, turn к игроку, fire = false
  240–520 → thrust = 0.4, turn к игроку, fire если угол носа к цели < 12°
  < 240  → thrust = -0.3 или strafe (turn случайный краткий импульс), fire

оружие:
  далеко → missile
  средне → plasma
  близко → laser
```

«Угол носа к цели»:

```ts
const toTarget = Math.atan2(player.y - me.y, player.x - me.x);
const diff = Phaser.Math.Angle.Wrap(toTarget - me.heading);
cmd.turn = Math.sign(diff);
```

Без pathfinding. Астероиды на MVP не ставить — ИИ не застрянет.

### 7.7. `ArenaBounds.ts`

Центр арены `(0,0)` или `(GAME_WIDTH/2, GAME_HEIGHT/2)` — выбрать **один** и везде его использовать. Рекомендуется мир вокруг `(0,0)`, камера следует за игроком.

Если `distance(ship, origin) > ARENA_RADIUS`:

```ts
const n = pos.normalize();
ship.body.velocity.subtract(n.scale(push * dt));
```

Не телепортировать и не убивать на краю.

### 7.8. `Hud.ts`

Phaser Text (фиксированный скролл камеры: `setScrollFactor(0)`):

- корпус: `Hull 72/80`
- щит: `Shield 40/40` + индикатор ON
- оружие: `LASER [■■■·]` (кулдаун)
- радар: маленькие точки врагов в круге 80px (направление, не точная карта)

---

## 8. Поток данных

```
MenuScene.shipId
    ↓
ArenaScene.create(data)
    ↓
Ship(player) ← InputController
Ship(enemy)  ← AIController
    ↓
CombatSystem → Projectile overlaps Ship
    ↓
все враги dead → Result { won: true }
игрок dead     → Result { won: false }
```

Счёт MVP: `score = 100 * убитых + floor(оставшийся hull) + floor(оставшийся shield)`.

---

## 9. Управление (зафиксировано)

| Клавиша | Действие |
|---|---|
| W | газ |
| S | тормоз (сильный drag) |
| A / D | поворот носа |
| Shift | щит (трата щита, штраф к ускорению) |
| Space / ЛКМ | стрельба текущим оружием |
| 1 / 2 / 3 | лазер / плазма / ракета |
| Esc | пауза (`this.scene.pause()` + overlay) |

---

## 10. Этапы реализации (порядок коммитов/работы)

### Этап 0 — каркас

Сделать:

- Vite + Phaser + 4 пустые сцены;
- `generateTexture` треугольника;
- движение игрока по `ShipCommand`;
- камера follow.

Готово, когда: W/A/S/D двигают корабль с инерцией.

### Этап 1 — бой

Сделать:

- `Projectile`, `CombatSystem`;
- один неподвижный враг-мишень;
- урон, смерть, переход в Result.

Готово, когда: выстрел убивает мишень и открывается экран победы.

### Этап 2 — щит и 3 оружия

Сделать:

- щит hold-to-use;
- таблица `WEAPONS`;
- переключение 1–3.

Готово, когда: лазер/плазма/ракеты отличаются на глаз, щит жрёт шкалу и блокирует урон.

### Этап 3 — ИИ

Сделать:

- 1 живой враг с тем же `Ship`;
- дистанции и выбор оружия;
- затем 3 врага с разными `ShipDef` (копии interceptor/tank).

Готово, когда: можно выиграть и проиграть без читов.

### Этап 4 — меню и полировка

Сделать:

- выбор 2 кораблей;
- HUD, звёздный фон, вспышка попадания (`particles` или 6 кадров Graphics);
- звуки (короткие wav);
- `localStorage` лучшего счёта.

Готово, когда: полный цикл из раздела 1 проходит без консольных ошибок.

### Этап 5 — опционально

Волны, аптечка, астероиды (тогда ИИ: обход по нормали), секторный прицел мышью.

---

## 11. Визуал на старте (без ассетов)

В `BootScene.create` до перехода в menu:

```ts
const g = this.make.graphics({ x: 0, y: 0 });
g.fillStyle(0x6ecbff, 1);
g.fillTriangle(16, 0, 0, 32, 32, 32);
g.generateTexture("ship-player", 32, 32);
g.clear();
g.fillStyle(0xff6b6b, 1);
g.fillTriangle(16, 0, 0, 32, 32, 32);
g.generateTexture("ship-enemy", 32, 32);
g.destroy();
```

Фон: 80–120 белых точек случайно в круге `ARENA_RADIUS`, `scrollFactor` 0.3–0.8 (параллакс).

---

## 12. Пауза и рестарт

```ts
// ArenaScene
pauseGame() {
  this.scene.pause();
  this.scene.launch("pause"); // или свой overlay в той же сцене
}
```

Рестарт боя: `this.scene.start("arena", { shipId })` — полная пересборка, не «оживлять» мёртвые объекты.

---

## 13. Что не кодировать в сценах

| Плохо | Хорошо |
|---|---|
| `if (weapon === "laser") damage = 8` в ArenaScene | `WEAPONS[id].damage` |
| ИИ двигает `body.velocity` сам | ИИ пишет `ShipCommand` |
| HP только у игрока в полях сцены | HP на `Ship` |
| `window` как глобальный стейт | `scene.start(key, data)` |

---

## 14. Критерии готовности MVP

- [ ] `npm run dev` открывает меню
- [ ] два корабля с разной скоростью/HP
- [ ] инерция + щит + 3 оружия
- [ ] 1–3 врага с ИИ
- [ ] win/lose + рестарт
- [ ] нет падений при смерти всех объектов
- [ ] управление как в таблице раздела 9

---

## 15. Первый следующий шаг в коде

1. `npm create vite@latest . -- --template vanilla-ts` в этой папке (или вручную файлы из раздела 2).
2. `npm i phaser`.
3. Заменить `src/main.ts` и добавить `src/game/config.ts` + пустые сцены.
4. Этап 0: треугольник летает.

Команды (PowerShell, из `C:\Users\ROBOT\space-tactics`):

```powershell
npm create vite@latest . -- --template vanilla-ts
npm i phaser
npm run dev
```
