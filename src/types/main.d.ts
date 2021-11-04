export interface InitStage {
    /** Name of this stage */
    name: string;
    /** Promise that initializes the module / runs this stage */
    fn: Promise<(void | InitStageResult)>;
}

export interface InitStageResult {
    /** Amount of milliseconds to deduct from measured initialization time */
    initTimeDeduction: number;
}
