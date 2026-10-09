import React, { useState } from 'react';
import { GameMode, WorldSettings } from '../game/types.ts';
import { soundManager } from '../game/audio.ts';
import { musicEngine } from '../game/music.ts';

interface PauseMenuProps {
  isOpen: boolean;
  onResume: () => void;
  gameMode: GameMode;
  onToggleGameMode: (mode: GameMode) => void;
  settings: WorldSettings;
  onUpdateSettings: (newSettings: WorldSettings) => void;
  onSaveWorld: () => void;
  onExportWorld: () => void;
  onImportWorld: (jsonStr: string) => void;
  onResetWorld: (generator: 'standard' | 'flat' | 'mountains' | 'islands', seed: number) => void;
  onOpenHelp: () => void;
  onSetTimeOfDay: (timeNorm: number) => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  isOpen,
  onResume,
  gameMode,
  onToggleGameMode,
  settings,
  onUpdateSettings,
  onSaveWorld,
  onExportWorld,
  onImportWorld,
  onResetWorld,
  onOpenHelp,
  onSetTimeOfDay,
}) => {
  const [tab, setTab] = useState<'main' | 'settings' | 'world'>('main');
  const [newSeed, setNewSeed] = useState(settings.seed.toString());
  const [selectedGenerator, setSelectedGenerator] = useState<'standard' | 'flat' | 'mountains' | 'islands'>(settings.generator);
  const [saveToast, setSaveToast] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveWorld();
    setSaveToast('Мир успешно сохранен!');
    setTimeout(() => setSaveToast(''), 2500);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (text) {
          onImportWorld(text);
          setSaveToast('Мир загружен из файла!');
          setTimeout(() => setSaveToast(''), 2500);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs select-none">
      <div className="mc-panel w-[460px] max-w-[95vw] p-6 flex flex-col items-center">
        {/* Title */}
        <h2
          className="font-pixel text-xl text-yellow-300 mb-6 drop-shadow-md text-center"
          style={{ textShadow: '2px 2px 0 #000' }}
        >
          {tab === 'main' ? 'Игра на паузе' : tab === 'settings' ? 'Настройки игры' : 'Управление миром'}
        </h2>

        {/* Save confirmation toast */}
        {saveToast && (
          <div className="mb-4 px-3 py-1 bg-emerald-700 border border-emerald-400 text-white font-mc text-sm rounded-xs animate-bounce">
            {saveToast}
          </div>
        )}

        {/* Tab 1: Main Menu */}
        {tab === 'main' && (
          <div className="w-full flex flex-col gap-3">
            <button
              onClick={onResume}
              className="mc-button w-full py-2.5 font-mc text-lg font-bold text-white shadow-md"
            >
              Вернуться в игру
            </button>

            <button
              onClick={() => onToggleGameMode(gameMode === 'creative' ? 'survival' : 'creative')}
              className="mc-button w-full py-2 font-mc text-base text-white"
            >
              Режим игры: <span className="text-yellow-300 font-bold">{gameMode === 'creative' ? 'Творческий (Creative)' : 'Выживание (Survival)'}</span>
            </button>

            <button
              onClick={() => setTab('settings')}
              className="mc-button w-full py-2 font-mc text-base text-white"
            >
              Настройки (Звук, Графика, Управление)
            </button>

            <button
              onClick={() => setTab('world')}
              className="mc-button w-full py-2 font-mc text-base text-white"
            >
              Генерация и сохранение мира
            </button>

            <button
              onClick={onOpenHelp}
              className="mc-button w-full py-2 font-mc text-base text-white"
            >
              Подсказки и управление клавишами
            </button>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={handleSave}
                className="mc-button py-2 font-mc text-sm text-emerald-200 font-bold"
              >
                💾 Сохранить мир
              </button>
              <button
                onClick={onExportWorld}
                className="mc-button py-2 font-mc text-sm text-sky-200 font-bold"
              >
                📥 Экспорт в файл
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Settings */}
        {tab === 'settings' && (
          <div className="w-full flex flex-col gap-3 font-mc text-base">
            {/* Volume */}
            <div className="flex flex-col gap-1 bg-[#a0a0a0] p-2 border border-[#666]">
              <div className="flex justify-between">
                <span>Громкость звуков:</span>
                <span className="font-bold">{Math.round(settings.soundVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.soundVolume}
                onChange={(e) => {
                  const vol = parseFloat(e.target.value);
                  soundManager.setVolume(vol);
                  onUpdateSettings({ ...settings, soundVolume: vol });
                }}
                className="w-full cursor-pointer"
              />
            </div>

            {/* Music Volume & Toggle */}
            <div className="flex flex-col gap-1.5 bg-[#a0a0a0] p-2 border border-[#666]">
              <div className="flex justify-between items-center">
                <span>Фоновая музыка:</span>
                <button
                  onClick={() => {
                    const nextEnabled = !settings.musicEnabled;
                    if (nextEnabled) {
                      musicEngine.setVolume(settings.musicVolume);
                      musicEngine.start();
                    } else {
                      musicEngine.stop();
                    }
                    onUpdateSettings({ ...settings, musicEnabled: nextEnabled });
                  }}
                  className={`px-2.5 py-0.5 text-xs font-bold rounded-xs cursor-pointer ${
                    settings.musicEnabled ? 'bg-emerald-600 text-white' : 'bg-red-700 text-white'
                  }`}
                >
                  {settings.musicEnabled ? 'ВКЛ' : 'ВЫКЛ'}
                </button>
              </div>
              <div className="flex justify-between">
                <span className="text-xs">Громкость музыки:</span>
                <span className="text-xs font-bold">{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.musicVolume}
                onChange={(e) => {
                  const mVol = parseFloat(e.target.value);
                  musicEngine.setVolume(mVol);
                  onUpdateSettings({ ...settings, musicVolume: mVol });
                }}
                className="w-full cursor-pointer"
              />
            </div>

            {/* Mouse Sensitivity */}
            <div className="flex flex-col gap-1 bg-[#a0a0a0] p-2 border border-[#666]">
              <div className="flex justify-between">
                <span>Чувствительность мыши:</span>
                <span className="font-bold">{settings.mouseSensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="2.5"
                step="0.1"
                value={settings.mouseSensitivity}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, mouseSensitivity: parseFloat(e.target.value) })
                }
                className="w-full cursor-pointer"
              />
            </div>

            {/* Field of View (FOV) */}
            <div className="flex flex-col gap-1 bg-[#a0a0a0] p-2 border border-[#666]">
              <div className="flex justify-between">
                <span>Угол обзора (FOV):</span>
                <span className="font-bold">{settings.fov}°</span>
              </div>
              <input
                type="range"
                min="60"
                max="95"
                step="5"
                value={settings.fov}
                onChange={(e) => onUpdateSettings({ ...settings, fov: parseInt(e.target.value) })}
                className="w-full cursor-pointer"
              />
            </div>

            {/* Render Distance */}
            <div className="flex flex-col gap-1 bg-[#a0a0a0] p-2 border border-[#666]">
              <div className="flex justify-between">
                <span>Дальность прорисовки:</span>
                <span className="font-bold">{settings.renderDistance} чанка</span>
              </div>
              <input
                type="range"
                min="2"
                max="4"
                step="1"
                value={settings.renderDistance}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, renderDistance: parseInt(e.target.value) })
                }
                className="w-full cursor-pointer"
              />
            </div>

            {/* Time Presets */}
            <div className="bg-[#a0a0a0] p-2 border border-[#666]">
              <span className="block mb-1 text-sm font-bold">Быстрое время суток:</span>
              <div className="grid grid-cols-4 gap-1">
                <button
                  onClick={() => onSetTimeOfDay(0.0)}
                  className="mc-button py-1 text-xs text-white"
                >
                  Утро
                </button>
                <button
                  onClick={() => onSetTimeOfDay(0.25)}
                  className="mc-button py-1 text-xs text-white"
                >
                  Полдень
                </button>
                <button
                  onClick={() => onSetTimeOfDay(0.5)}
                  className="mc-button py-1 text-xs text-white"
                >
                  Закат
                </button>
                <button
                  onClick={() => onSetTimeOfDay(0.75)}
                  className="mc-button py-1 text-xs text-white"
                >
                  Полночь
                </button>
              </div>
            </div>

            <button
              onClick={() => setTab('main')}
              className="mc-button w-full py-2 font-mc text-base text-white mt-2"
            >
              Назад
            </button>
          </div>
        )}

        {/* Tab 3: World Management */}
        {tab === 'world' && (
          <div className="w-full flex flex-col gap-3 font-mc text-base">
            <div className="bg-[#a0a0a0] p-3 border border-[#666] space-y-2">
              <span className="block font-bold">Тип генератора мира:</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'standard', name: 'Обычный (Холмы)' },
                  { id: 'flat', name: 'Плоский (Суперплоский)' },
                  { id: 'mountains', name: 'Высокие горы' },
                  { id: 'islands', name: 'Остров' },
                ].map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGenerator(g.id as any)}
                    className={`py-1 px-2 text-xs text-left transition-colors ${
                      selectedGenerator === g.id
                        ? 'bg-[#555] text-yellow-300 font-bold border border-yellow-300'
                        : 'mc-button'
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <label className="block text-xs mb-1">Сид генерации (число):</label>
                <input
                  type="text"
                  value={newSeed}
                  onChange={(e) => setNewSeed(e.target.value)}
                  className="w-full px-2 py-1 bg-white text-black text-sm border border-[#555]"
                />
              </div>

              <button
                onClick={() => {
                  const seedNum = parseInt(newSeed) || Math.floor(Math.random() * 999999);
                  onResetWorld(selectedGenerator, seedNum);
                  onResume();
                }}
                className="mc-button w-full py-1.5 text-sm font-bold text-white mt-2 bg-red-800"
              >
                Создать новый мир
              </button>
            </div>

            {/* Import file */}
            <div className="bg-[#a0a0a0] p-2 border border-[#666] flex items-center justify-between">
              <span className="text-xs">Загрузить мир из .json:</span>
              <label className="mc-button px-2 py-1 text-xs cursor-pointer text-white">
                Выбрать файл
                <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
              </label>
            </div>

            <button
              onClick={() => setTab('main')}
              className="mc-button w-full py-2 font-mc text-base text-white mt-2"
            >
              Назад
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
