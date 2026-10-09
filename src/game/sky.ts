import * as THREE from 'three';

export class SkyManager {
  private scene: THREE.Scene;
  private sunLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private sunMesh: THREE.Mesh;
  private moonMesh: THREE.Mesh;
  private stars: THREE.Points;

  // Time of day: 0.0 = sunrise, 0.25 = noon, 0.5 = sunset, 0.75 = midnight, 1.0 = next sunrise
  public timeOfDay: number = 0.2; // start mid morning
  public timeSpeed: number = 1.0; // 1 full day = ~10 minutes by default
  public isTimeFrozen: boolean = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Ambient light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(this.ambientLight);

    // Sun directional light
    this.sunLight = new THREE.DirectionalLight(0xfff4e0, 1.2);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    scene.add(this.sunLight);

    // Sun square mesh
    const sunGeo = new THREE.PlaneGeometry(16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff3a8, side: THREE.DoubleSide });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    scene.add(this.sunMesh);

    // Moon square mesh
    const moonGeo = new THREE.PlaneGeometry(14, 14);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xe6e6f0, side: THREE.DoubleSide });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    scene.add(this.moonMesh);

    // Stars
    const starCount = 450;
    const starGeo = new THREE.BufferGeometry();
    const starPositions: number[] = [];

    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 180;
      starPositions.push(
        r * Math.sin(phi) * Math.cos(theta),
        Math.abs(r * Math.cos(phi)), // upper hemisphere
        r * Math.sin(phi) * Math.sin(theta)
      );
    }

    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, transparent: true, opacity: 0 });
    this.stars = new THREE.Points(starGeo, starMat);
    scene.add(this.stars);

    // Scene Fog
    this.scene.fog = new THREE.Fog(0x78a7ff, 35, 75);
  }

  update(dt: number, playerPos: THREE.Vector3) {
    if (!this.isTimeFrozen) {
      // 1 day cycle = 600 seconds (10 min) at 1x
      this.timeOfDay = (this.timeOfDay + (dt / 600) * this.timeSpeed) % 1.0;
    }

    const angle = this.timeOfDay * Math.PI * 2;
    const distance = 160;

    // Sun position
    const sunX = playerPos.x + Math.sin(angle) * distance;
    const sunY = playerPos.y + Math.cos(angle) * distance;
    const sunZ = playerPos.z;

    // Moon opposite to sun
    const moonX = playerPos.x - Math.sin(angle) * distance;
    const moonY = playerPos.y - Math.cos(angle) * distance;
    const moonZ = playerPos.z;

    this.sunLight.position.set(sunX, sunY, sunZ);
    this.sunLight.target.position.copy(playerPos);

    this.sunMesh.position.set(sunX, sunY, sunZ);
    this.sunMesh.lookAt(playerPos);

    this.moonMesh.position.set(moonX, moonY, moonZ);
    this.moonMesh.lookAt(playerPos);

    // Sky colors interpolation:
    // Day (sunY > 20), Sunset/Sunrise (sunY between -20 and 20), Night (sunY < -20)
    const dayColor = new THREE.Color(0x78a7ff);
    const sunsetColor = new THREE.Color(0xe87a4a);
    const nightColor = new THREE.Color(0x0c1020);

    let skyColor: THREE.Color;
    let lightIntensity = 1.0;
    let starOpacity = 0.0;

    const sunHeightNorm = Math.cos(angle); // 1 = noon, -1 = midnight

    if (sunHeightNorm > 0.2) {
      // Full day
      skyColor = dayColor;
      lightIntensity = 1.2;
      this.ambientLight.intensity = 0.45;
      starOpacity = 0.0;
    } else if (sunHeightNorm > -0.2) {
      // Sunrise / Sunset transition
      const t = (sunHeightNorm + 0.2) / 0.4;
      skyColor = new THREE.Color().lerpColors(sunsetColor, dayColor, t);
      lightIntensity = 0.5 + t * 0.7;
      this.ambientLight.intensity = 0.25 + t * 0.2;
      starOpacity = 1.0 - t;
    } else {
      // Night
      const t = Math.max(0, (sunHeightNorm + 0.2) / -0.8);
      skyColor = new THREE.Color().lerpColors(sunsetColor, nightColor, Math.min(1.0, t * 2));
      lightIntensity = 0.15;
      this.ambientLight.intensity = 0.12;
      starOpacity = Math.min(1.0, t * 1.5);
    }

    this.sunLight.intensity = lightIntensity;
    (this.stars.material as THREE.PointsMaterial).opacity = starOpacity;
    this.stars.position.copy(playerPos);

    this.scene.background = skyColor;
    if (this.scene.fog) {
      this.scene.fog.color = skyColor;
    }
  }

  getSkyState(): { timeOfDay: number; isNight: boolean; hours: number; minutes: number } {
    // Convert 0..1 to 24h clock: 0.0 = 06:00 (sunrise), 0.25 = 12:00, 0.5 = 18:00, 0.75 = 00:00
    const totalMinutes = Math.floor(((this.timeOfDay + 0.25) % 1.0) * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const isNight = this.timeOfDay > 0.45 && this.timeOfDay < 0.95;

    return {
      timeOfDay: this.timeOfDay,
      isNight,
      hours,
      minutes,
    };
  }
}
