const { createApp } = Vue;

createApp({
  data() {
    return {
      // 入力値
      windSpeed: '',
      waterTemp: '',
      wave: '',
      fog: '',
      thunder: '',
      
      // バリデーションエラー
      errors: {
        windSpeed: false,
        waterTemp: false,
        wave: false,
        fog: false,
        thunder: false
      },
      
      // 選択肢
      waterTempOptions: [
        '15℃未満',
        '15℃以上'
      ],
      waveOptions: [
        '波がない、もしくは微弱',
        '波はあるが、白波はない',
        '白波がいたるところでみられる'
      ],
      fogOptions: [
        '霧が出ていない',
        '霧が出ており、中島を確認できない',
        '霧が出ており、中島を確認できる'
      ],
      thunderOptions: [
        '雷鳴が聞こえない・雷注意報は出ていない',
        '雷鳴が聞こえる・雷注意報が出ている'
      ],
      
      // 結果（3つのクルータイプ分）
      results: null
    };
  },
  
  computed: {
    // 風速を整数に変換（切り捨て）
    windSpeedInt() {
      return Math.floor(parseFloat(this.windSpeed) || 0);
    }
  },
  
  methods: {
    // バリデーション
    validateInputs() {
      this.errors.windSpeed = this.windSpeed === '' || this.windSpeed === null;
      this.errors.waterTemp = this.waterTemp === '';
      this.errors.wave = this.wave === '';
      this.errors.fog = this.fog === '';
      this.errors.thunder = this.thunder === '';
      
      return !this.errors.windSpeed && !this.errors.waterTemp && 
             !this.errors.wave && !this.errors.fog && !this.errors.thunder;
    },
    
    // 乗艇判断を実行
    judgeBoating() {
      // バリデーションチェック
      if (!this.validateInputs()) {
        return;
      }
      // 雷のチェック（最優先）
      if (this.thunder === '雷鳴が聞こえる・雷注意報が出ている') {
        this.results = {
          prohibited: true,
          reason: '雷鳴が聞こえる・雷注意報が出ています',
          crews: [
            { type: '漕歴 2 年以上漕手がいない艇', status: 'prohibited', message: '乗艇禁止' },
            { type: '漕歴 2 年以上漕手がクルーの半数以下の', status: 'prohibited', message: '乗艇禁止' },
            { type: '漕歴 2 年以上漕手がクルーの半数より多い', status: 'prohibited', message: '乗艇禁止' }
          ]
        };
        return;
      }
      
      // 霧のチェック（中島確認できない場合）
      if (this.fog === '霧が出ており、中島を確認できない') {
        this.results = {
          prohibited: true,
          reason: '霧が出ており、中島を確認できません',
          crews: [
            { type: '漕歴 2 年以上漕手がいない艇', status: 'prohibited', message: '乗艇禁止' },
            { type: '漕歴 2 年以上漕手がクルーの半数以下の', status: 'prohibited', message: '乗艇禁止' },
            { type: '漕歴 2 年以上漕手がクルーの半数より多い', status: 'prohibited', message: '乗艇禁止' }
          ]
        };
        return;
      }
      
      // 白波のチェック
      if (this.wave === '白波がいたるところでみられる') {
        this.results = {
          prohibited: true,
          reason: '白波がいたるところでみられます',
          crews: [
            { type: '漕歴 2 年以上漕手がいない艇', status: 'prohibited', message: '乗艇禁止' },
            { type: '漕歴 2 年以上漕手がクルーの半数以下の', status: 'prohibited', message: '乗艇禁止' },
            { type: '漕歴 2 年以上漕手がクルーの半数より多い', status: 'prohibited', message: '乗艇禁止' }
          ]
        };
        return;
      }
      
      // 表1に基づく判断（3パターン全て）
      const crewTypes = [
        '漕歴 2 年以上漕手がいない',
        '漕歴 2 年以上漕手がクルーの半数以下の',
        '漕歴 2 年以上漕手がクルーの半数より多い'
      ];
      
      this.results = {
        prohibited: false,
        crews: crewTypes.map(crewType => {
          const riskLevel = this.getRiskLevel(crewType);
          let status, message;
          
          if (riskLevel === 'blue') {
            status = 'allowed';
            message = '乗艇可能';
          } else if (riskLevel === 'yellow') {
            status = 'restricted';
            message = '小艇は禁止。大艇は希望があればコースを制限したうえで乗艇可。';
          } else {
            status = 'prohibited';
            message = '乗艇禁止';
          }
          
          return {
            type: crewType + '艇',
            status: status,
            message: message
          };
        })
      };
    },
    
    // リスクレベルを取得（表1に基づく）
    getRiskLevel(crewType) {
      const ws = this.windSpeedInt;
      const waveType = this.wave;
      const waterTempType = this.waterTemp;
      
      // 波がない、もしくは微弱
      if (waveType === '波がない、もしくは微弱') {
        if (waterTempType === '15℃未満') {
          if (crewType === '漕歴 2 年以上漕手がいない') {
            if (ws >= 0 && ws <= 2) return 'blue';
            if (ws >= 3 && ws <= 4) return 'yellow';
            return 'red'; // ws >= 5
          } else if (crewType === '漕歴 2 年以上漕手がクルーの半数以下の') {
            if (ws >= 0 && ws <= 3) return 'blue';
            if (ws === 4) return 'yellow';
            return 'red'; // ws >= 5
          } else { // 半数より多い
            if (ws >= 0 && ws <= 4) return 'blue';
            if (ws >= 5 && ws <= 7) return 'yellow';
            return 'red'; // ws >= 8
          }
        } else { // 15℃以上
          if (crewType === '漕歴 2 年以上漕手がいない') {
            if (ws >= 0 && ws <= 3) return 'blue';
            if (ws >= 4 && ws <= 5) return 'yellow';
            return 'red'; // ws >= 6
          } else if (crewType === '漕歴 2 年以上漕手がクルーの半数以下の') {
            if (ws >= 0 && ws <= 4) return 'blue';
            if (ws === 5) return 'yellow';
            return 'red'; // ws >= 6
          } else { // 半数より多い
            if (ws >= 0 && ws <= 5) return 'blue';
            if (ws >= 6 && ws <= 7) return 'yellow';
            return 'red'; // ws >= 8
          }
        }
      }
      
      // 波はあるが、白波はない
      if (waveType === '波はあるが、白波はない') {
        if (waterTempType === '15℃未満') {
          if (crewType === '漕歴 2 年以上漕手がいない') {
            if (ws >= 0 && ws <= 1) return 'blue';
            if (ws >= 2 && ws <= 4) return 'yellow';
            return 'red'; // ws >= 5
          } else if (crewType === '漕歴 2 年以上漕手がクルーの半数以下の') {
            if (ws >= 0 && ws <= 3) return 'blue';
            if (ws === 4) return 'yellow';
            return 'red'; // ws >= 5
          } else { // 半数より多い
            if (ws >= 0 && ws <= 3) return 'blue';
            if (ws >= 4 && ws <= 5) return 'yellow';
            return 'red'; // ws >= 6
          }
        } else { // 15℃以上
          if (crewType === '漕歴 2 年以上漕手がいない') {
            if (ws >= 0 && ws <= 2) return 'blue';
            if (ws >= 3 && ws <= 4) return 'yellow';
            return 'red'; // ws >= 5
          } else if (crewType === '漕歴 2 年以上漕手がクルーの半数以下の') {
            if (ws >= 0 && ws <= 3) return 'blue';
            if (ws === 4) return 'yellow';
            return 'red'; // ws >= 5
          } else { // 半数より多い
            if (ws >= 0 && ws <= 4) return 'blue';
            if (ws === 5) return 'yellow';
            return 'red'; // ws >= 6
          }
        }
      }
      
      return 'red';
    }
  }
}).mount('#app');